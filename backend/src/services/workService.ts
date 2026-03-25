import { AppDataSource } from '../config/database.js';
import { Work } from '../models/Work.js';
import { Album } from '../models/Album.js';
import { Tag } from '../models/Tag.js';
import { uploadService } from './uploadService.js';
import { In, Repository } from 'typeorm';

export interface CreateWorkData {
  title: string;
  description?: string;
  filePath: string;
  thumbnailSmall?: string;
  thumbnailLarge?: string;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  isPublic?: boolean;
  albumIds?: string[];
  tagIds?: string[];
}

export interface UpdateWorkData {
  title?: string;
  description?: string;
  isPublic?: boolean;
  isPinned?: boolean;
  position?: number;
  albumIds?: string[];
  tagIds?: string[];
}

export class WorkService {
  private workRepo: Repository<Work>;
  private albumRepo: Repository<Album>;
  private tagRepo: Repository<Tag>;

  constructor() {
    this.workRepo = AppDataSource.getRepository(Work);
    this.albumRepo = AppDataSource.getRepository(Album);
    this.tagRepo = AppDataSource.getRepository(Tag);
  }

  async createWork(data: CreateWorkData): Promise<Work> {
    const work = new Work();
    work.title = data.title;
    work.description = data.description || '';
    work.filePath = data.filePath;
    work.thumbnailSmall = data.thumbnailSmall || '';
    work.thumbnailLarge = data.thumbnailLarge || '';
    work.originalFilename = data.originalFilename;
    work.fileType = data.fileType;
    work.mimeType = data.mimeType;
    work.fileSize = data.fileSize;
    work.isPublic = data.isPublic ?? true;
    work.position = await this.getNextPosition();
    work.viewCount = 0;
    work.downloadCount = 0;
    work.isPinned = false;
    work.albums = [];
    work.tags = [];

    // Set albums
    if (data.albumIds && data.albumIds.length > 0) {
      work.albums = await this.albumRepo.findBy({ id: In(data.albumIds) });
    }

    // Set tags
    if (data.tagIds && data.tagIds.length > 0) {
      work.tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
    }

    return this.workRepo.save(work);
  }

  async getWorks(options?: { albumId?: string; tagId?: string; isPublic?: boolean }): Promise<Work[]> {
    const query = this.workRepo.createQueryBuilder('work')
      .leftJoinAndSelect('work.albums', 'albums')
      .leftJoinAndSelect('work.tags', 'tags');

    if (options?.albumId) {
      query.andWhere('albums.id = :albumId', { albumId: options.albumId });
    }
    if (options?.tagId) {
      query.andWhere('tags.id = :tagId', { tagId: options.tagId });
    }
    if (options?.isPublic !== undefined) {
      query.andWhere('work.isPublic = :isPublic', { isPublic: options.isPublic });
    }

    // Sort: pinned first, then by position
    query.orderBy('work.isPinned', 'DESC')
         .addOrderBy('work.position', 'ASC');

    return query.getMany();
  }

  async getWorkById(id: string): Promise<Work | null> {
    return this.workRepo.findOne({
      where: { id },
      relations: ['albums', 'tags'],
    });
  }

  async updateWork(id: string, data: UpdateWorkData): Promise<Work | null> {
    const work = await this.getWorkById(id);
    if (!work) return null;

    if (data.title !== undefined) work.title = data.title;
    if (data.description !== undefined) work.description = data.description;
    if (data.isPublic !== undefined) work.isPublic = data.isPublic;
    if (data.isPinned !== undefined) work.isPinned = data.isPinned;
    if (data.position !== undefined) work.position = data.position;

    if (data.albumIds !== undefined) {
      work.albums = await this.albumRepo.findBy({ id: In(data.albumIds) });
    }
    if (data.tagIds !== undefined) {
      work.tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
    }

    return this.workRepo.save(work);
  }

  async deleteWork(id: string): Promise<boolean> {
    const work = await this.getWorkById(id);
    if (!work) return false;

    // Delete associated files
    await uploadService.deleteFile(work.filePath, work.thumbnailSmall || undefined, work.thumbnailLarge || undefined);

    await this.workRepo.remove(work);
    return true;
  }

  async setWorksPosition(positions: { id: string; position: number }[]): Promise<void> {
    await Promise.all(
      positions.map(({ id, position }) =>
        this.workRepo.update(id, { position })
      )
    );
  }

  private async getNextPosition(): Promise<number> {
    const result = await this.workRepo
      .createQueryBuilder('work')
      .select('MAX(work.position)', 'max')
      .getRawOne();
    return (result?.max || 0) + 1;
  }

  /**
   * Increment download count for a work
   */
  async incrementDownloadCount(id: string): Promise<void> {
    await this.workRepo.increment({ id }, 'downloadCount', 1);
  }
}

export const workService = new WorkService();