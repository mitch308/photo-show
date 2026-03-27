import { AppDataSource } from '../config/database.js';
import { Work } from '../models/Work.js';
import { Album } from '../models/Album.js';
import { Tag } from '../models/Tag.js';
import { uploadService } from './uploadService.js';
import { mediaItemService } from './mediaItemService.js';
import { In, Repository } from 'typeorm';

export interface MediaItemInput {
  filePath: string;
  thumbnailSmall?: string;
  thumbnailLarge?: string;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
}

export interface CreateWorkData {
  title: string;
  description?: string;
  // Legacy fields - kept for backward compatibility
  filePath?: string;
  thumbnailSmall?: string;
  thumbnailLarge?: string;
  originalFilename?: string;
  fileType?: 'image' | 'video';
  mimeType?: string;
  fileSize?: number;
  isPublic?: boolean;
  albumIds?: string[];
  tagIds?: string[];
  // New field for multiple media items
  mediaItems?: MediaItemInput[];
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

    // Legacy fields - kept for backward compatibility
    work.filePath = data.filePath || '';
    work.thumbnailSmall = data.thumbnailSmall || '';
    work.thumbnailLarge = data.thumbnailLarge || '';
    work.originalFilename = data.originalFilename || '';
    work.fileType = data.fileType || 'image';
    work.mimeType = data.mimeType || '';
    work.fileSize = data.fileSize || 0;

    work.isPublic = data.isPublic ?? true;
    work.position = await this.getNextPosition();
    work.viewCount = 0;
    work.downloadCount = 0;
    work.isPinned = false;
    work.albums = [];
    work.tags = [];
    work.mediaItems = [];

    // Set albums
    if (data.albumIds && data.albumIds.length > 0) {
      work.albums = await this.albumRepo.findBy({ id: In(data.albumIds) });
    }

    // Set tags
    if (data.tagIds && data.tagIds.length > 0) {
      work.tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
    }

    // Save work first to get ID
    const savedWork = await this.workRepo.save(work);

    // Create media items if provided
    if (data.mediaItems && data.mediaItems.length > 0) {
      for (let i = 0; i < data.mediaItems.length; i++) {
        const item = data.mediaItems[i];
        await mediaItemService.createMediaItem(savedWork.id, {
          ...item,
          position: i,
        });
      }

      // Reload work with media items
      const workWithItems = await this.getWorkById(savedWork.id);
      if (workWithItems) {
        return workWithItems;
      }
    }

    return savedWork;
  }

  async getWorks(options?: { albumId?: string; tagId?: string; isPublic?: boolean; title?: string; isPinned?: boolean }): Promise<Work[]> {
    const query = this.workRepo.createQueryBuilder('work')
      .leftJoinAndSelect('work.albums', 'albums')
      .leftJoinAndSelect('work.tags', 'tags')
      .leftJoinAndSelect('work.mediaItems', 'mediaItems');

    if (options?.albumId) {
      query.andWhere('albums.id = :albumId', { albumId: options.albumId });
    }
    if (options?.tagId) {
      query.andWhere('tags.id = :tagId', { tagId: options.tagId });
    }
    if (options?.isPublic !== undefined) {
      query.andWhere('work.isPublic = :isPublic', { isPublic: options.isPublic });
    }
    if (options?.title) {
      query.andWhere('work.title LIKE :title', { title: `%${options.title}%` });
    }
    if (options?.isPinned !== undefined) {
      query.andWhere('work.isPinned = :isPinned', { isPinned: options.isPinned });
    }

    // Sort: pinned first, then by position
    query.orderBy('work.isPinned', 'DESC')
         .addOrderBy('work.position', 'ASC')
         .addOrderBy('mediaItems.position', 'ASC');

    return query.getMany();
  }

  async getWorkById(id: string): Promise<Work | null> {
    return this.workRepo.findOne({
      where: { id },
      relations: ['albums', 'tags', 'mediaItems'],
      order: {
        mediaItems: {
          position: 'ASC',
        },
      },
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

    await this.workRepo.save(work);
    // Reload work with all relations including mediaItems
    return this.getWorkById(id);
  }

  async deleteWork(id: string): Promise<boolean> {
    const work = await this.getWorkById(id);
    if (!work) return false;

    // Delete all associated media items first
    await mediaItemService.deleteMediaItemsByWork(id);

    // Delete legacy associated files (if any)
    if (work.filePath) {
      await uploadService.deleteFile(work.filePath, work.thumbnailSmall || undefined, work.thumbnailLarge || undefined);
    }

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