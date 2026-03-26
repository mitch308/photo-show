import { AppDataSource } from '../config/database.js';
import { Album } from '../models/Album.js';
import { Work } from '../models/Work.js';
import { In } from 'typeorm';

export interface CreateAlbumData {
  name: string;
  description?: string;
  coverPath?: string;
  workIds?: string[];
}

export interface UpdateAlbumData {
  name?: string;
  description?: string;
  coverPath?: string;
  position?: number;
  workIds?: string[];
}

export class AlbumService {
  private albumRepo = AppDataSource.getRepository(Album);
  private workRepo = AppDataSource.getRepository(Work);

  async createAlbum(data: CreateAlbumData): Promise<Album> {
    const album = this.albumRepo.create({
      name: data.name,
      description: data.description || '',
      coverPath: data.coverPath,
      position: await this.getNextPosition(),
    });

    if (data.workIds && data.workIds.length > 0) {
      album.works = await this.workRepo.findBy({ id: In(data.workIds) });
      // Set default cover from first work per D-14
      if (!album.coverPath && album.works.length > 0) {
        album.coverPath = album.works[0].thumbnailSmall;
      }
    }

    return this.albumRepo.save(album);
  }

  async getAlbums(name?: string): Promise<Album[]> {
    const query = this.albumRepo.createQueryBuilder('album')
      .leftJoinAndSelect('album.works', 'works');
    
    if (name) {
      query.andWhere('album.name LIKE :name', { name: `%${name}%` });
    }
    
    query.orderBy('album.position', 'ASC');
    return query.getMany();
  }

  async getAlbumById(id: string): Promise<Album | null> {
    return this.albumRepo.findOne({
      where: { id },
      relations: ['works', 'works.tags', 'works.mediaItems'],
      order: {
        works: {
          position: 'ASC',
          mediaItems: {
            position: 'ASC',
          },
        },
      },
    });
  }

  async updateAlbum(id: string, data: UpdateAlbumData): Promise<Album | null> {
    const album = await this.albumRepo.findOne({
      where: { id },
      relations: ['works'],
    });
    if (!album) return null;

    if (data.name !== undefined) album.name = data.name;
    if (data.description !== undefined) album.description = data.description;
    if (data.coverPath !== undefined) album.coverPath = data.coverPath;
    if (data.position !== undefined) album.position = data.position;

    if (data.workIds !== undefined) {
      album.works = await this.workRepo.findBy({ id: In(data.workIds) });
    }

    return this.albumRepo.save(album);
  }

  async deleteAlbum(id: string, deleteWorks: boolean = false): Promise<boolean> {
    const album = await this.albumRepo.findOne({
      where: { id },
      relations: ['works'],
    });
    if (!album) return false;

    if (deleteWorks) {
      // Delete all works in this album per D-13
      for (const work of album.works) {
        // Use workService to delete (handles file cleanup)
        const { workService } = await import('./workService.js');
        await workService.deleteWork(work.id);
      }
    }

    await this.albumRepo.remove(album);
    return true;
  }

  async setAlbumsPosition(positions: { id: string; position: number }[]): Promise<void> {
    await Promise.all(
      positions.map(({ id, position }) =>
        this.albumRepo.update(id, { position })
      )
    );
  }

  private async getNextPosition(): Promise<number> {
    const result = await this.albumRepo
      .createQueryBuilder('album')
      .select('MAX(album.position)', 'max')
      .getRawOne();
    return (result?.max || 0) + 1;
  }
}

export const albumService = new AlbumService();