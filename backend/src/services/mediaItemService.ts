import { AppDataSource } from '../config/database.js';
import { MediaItem } from '../models/MediaItem.js';
import { Work } from '../models/Work.js';
import { uploadService } from './uploadService.js';
import { Repository } from 'typeorm';

export interface CreateMediaItemData {
  filePath: string;
  thumbnailSmall?: string;
  thumbnailLarge?: string;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  position?: number;
  fileHash?: string;
}

export interface UpdateMediaItemData {
  position?: number;
}

export class MediaItemService {
  private mediaItemRepo: Repository<MediaItem>;
  private workRepo: Repository<Work>;

  constructor() {
    this.mediaItemRepo = AppDataSource.getRepository(MediaItem);
    this.workRepo = AppDataSource.getRepository(Work);
  }

  /**
   * Create a media item for a work
   */
  async createMediaItem(workId: string, data: CreateMediaItemData): Promise<MediaItem> {
    // Verify work exists
    const work = await this.workRepo.findOne({ where: { id: workId } });
    if (!work) {
      throw new Error(`Work with id ${workId} not found`);
    }

    // Get next position if not provided
    const position = data.position ?? await this.getNextPosition(workId);

    const mediaItem = new MediaItem();
    mediaItem.workId = workId;
    mediaItem.filePath = data.filePath;
    mediaItem.thumbnailSmall = data.thumbnailSmall || '';
    mediaItem.thumbnailLarge = data.thumbnailLarge || '';
    mediaItem.originalFilename = data.originalFilename;
    mediaItem.fileType = data.fileType;
    mediaItem.mimeType = data.mimeType;
    mediaItem.fileSize = data.fileSize;
    mediaItem.position = position;
    mediaItem.fileHash = data.fileHash || '';

    return this.mediaItemRepo.save(mediaItem);
  }

  /**
   * Get all media items for a work, sorted by position
   */
  async getMediaItemsByWork(workId: string): Promise<MediaItem[]> {
    return this.mediaItemRepo.find({
      where: { workId },
      order: { position: 'ASC' },
    });
  }

  /**
   * Get a single media item by ID
   */
  async getMediaItemById(id: string): Promise<MediaItem | null> {
    return this.mediaItemRepo.findOne({
      where: { id },
      relations: ['work'],
    });
  }

  /**
   * Update media item (position, etc.)
   */
  async updateMediaItem(id: string, data: UpdateMediaItemData): Promise<MediaItem | null> {
    const mediaItem = await this.mediaItemRepo.findOne({ where: { id } });
    if (!mediaItem) return null;

    if (data.position !== undefined) {
      mediaItem.position = data.position;
    }

    return this.mediaItemRepo.save(mediaItem);
  }

  /**
   * Delete a media item and its associated files
   */
  async deleteMediaItem(id: string): Promise<boolean> {
    const mediaItem = await this.mediaItemRepo.findOne({ where: { id } });
    if (!mediaItem) return false;

    // Delete associated files
    await uploadService.deleteFile(
      mediaItem.filePath,
      mediaItem.thumbnailSmall || undefined,
      mediaItem.thumbnailLarge || undefined
    );

    await this.mediaItemRepo.remove(mediaItem);
    return true;
  }

  /**
   * Reorder media items within a work
   */
  async reorderMediaItems(workId: string, itemIds: string[]): Promise<void> {
    // Verify all items belong to the work
    const items = await this.getMediaItemsByWork(workId);
    const itemIdsSet = new Set(itemIds);

    // Check that all provided IDs exist and belong to this work
    for (const item of items) {
      if (!itemIdsSet.has(item.id)) {
        throw new Error(`Media item ${item.id} not found in reorder list`);
      }
    }

    // Check that we're not missing any items
    if (items.length !== itemIds.length) {
      throw new Error('Reorder list must include all media items');
    }

    // Update positions
    await Promise.all(
      itemIds.map((id, index) =>
        this.mediaItemRepo.update(id, { position: index })
      )
    );
  }

  /**
   * Delete all media items for a work
   */
  async deleteMediaItemsByWork(workId: string): Promise<void> {
    const items = await this.getMediaItemsByWork(workId);

    // Delete all associated files
    for (const item of items) {
      await uploadService.deleteFile(
        item.filePath,
        item.thumbnailSmall || undefined,
        item.thumbnailLarge || undefined
      );
    }

    // Delete all items
    await this.mediaItemRepo.delete({ workId });
  }

  /**
   * Get the count of media items for a work
   */
  async getMediaItemCount(workId: string): Promise<number> {
    return this.mediaItemRepo.count({ where: { workId } });
  }

  /**
   * Find a media item by file hash
   */
  async findByHash(hash: string): Promise<MediaItem | null> {
    return this.mediaItemRepo.findOne({
      where: { fileHash: hash },
      relations: ['work'],
    });
  }

  /**
   * Get the next position for a new media item in a work
   */
  private async getNextPosition(workId: string): Promise<number> {
    const result = await this.mediaItemRepo
      .createQueryBuilder('mediaItem')
      .select('MAX(mediaItem.position)', 'max')
      .where('mediaItem.workId = :workId', { workId })
      .getRawOne();
    return (result?.max || -1) + 1;
  }
}

export const mediaItemService = new MediaItemService();