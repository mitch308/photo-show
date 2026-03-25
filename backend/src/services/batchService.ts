import { AppDataSource } from '../config/database.js';
import { Work } from '../models/Work.js';
import { Album } from '../models/Album.js';
import { In, Repository } from 'typeorm';
import { uploadService } from './uploadService.js';

/**
 * Batch operation result
 */
export interface BatchResult {
  success: string[];
  failed: { id: string; reason: string }[];
}

/**
 * Service for batch operations on works
 * Per BATCH-01~04: 批量选择、修改状态、移动、删除作品
 */
export class BatchService {
  private workRepo: Repository<Work>;
  private albumRepo: Repository<Album>;

  constructor() {
    this.workRepo = AppDataSource.getRepository(Work);
    this.albumRepo = AppDataSource.getRepository(Album);
  }

  /**
   * Batch update isPublic status
   * Per BATCH-02: 管理员可以批量修改作品的公开状态
   */
  async batchUpdateStatus(workIds: string[], isPublic: boolean): Promise<BatchResult> {
    const result: BatchResult = { success: [], failed: [] };

    for (const id of workIds) {
      try {
        const work = await this.workRepo.findOne({ where: { id } });
        if (!work) {
          result.failed.push({ id, reason: '作品不存在' });
          continue;
        }

        work.isPublic = isPublic;
        await this.workRepo.save(work);
        result.success.push(id);
      } catch (error: any) {
        result.failed.push({ id, reason: error.message });
      }
    }

    return result;
  }

  /**
   * Batch move works to albums
   * Per BATCH-03: 管理员可以批量移动作品到相册
   * @param workIds - Works to move
   * @param albumIds - Target albums (works will be added to these albums)
   * @param mode - 'add' to add albums, 'set' to replace albums, 'remove' to remove from albums
   */
  async batchMoveWorks(
    workIds: string[],
    albumIds: string[],
    mode: 'add' | 'set' | 'remove' = 'set'
  ): Promise<BatchResult> {
    const result: BatchResult = { success: [], failed: [] };

    // Fetch target albums
    const targetAlbums = await this.albumRepo.findBy({ id: In(albumIds) });

    if (targetAlbums.length !== albumIds.length) {
      const foundIds = targetAlbums.map(a => a.id);
      const missingIds = albumIds.filter(id => !foundIds.includes(id));
      // Continue with valid albums, log warning for missing ones
      console.warn(`Albums not found: ${missingIds.join(', ')}`);
    }

    for (const id of workIds) {
      try {
        const work = await this.workRepo.findOne({
          where: { id },
          relations: ['albums'],
        });

        if (!work) {
          result.failed.push({ id, reason: '作品不存在' });
          continue;
        }

        switch (mode) {
          case 'set':
            // Replace all albums
            work.albums = targetAlbums;
            break;
          case 'add':
            // Add to existing albums
            const existingIds = work.albums.map(a => a.id);
            const newAlbums = targetAlbums.filter(a => !existingIds.includes(a.id));
            work.albums = [...work.albums, ...newAlbums];
            break;
          case 'remove':
            // Remove specified albums
            const removeIds = new Set(albumIds);
            work.albums = work.albums.filter(a => !removeIds.has(a.id));
            break;
        }

        await this.workRepo.save(work);
        result.success.push(id);
      } catch (error: any) {
        result.failed.push({ id, reason: error.message });
      }
    }

    return result;
  }

  /**
   * Batch delete works
   * Per BATCH-04: 管理员可以批量删除作品
   */
  async batchDeleteWorks(workIds: string[]): Promise<BatchResult> {
    const result: BatchResult = { success: [], failed: [] };

    for (const id of workIds) {
      try {
        const work = await this.workRepo.findOne({
          where: { id },
          relations: ['albums', 'tags'],
        });

        if (!work) {
          result.failed.push({ id, reason: '作品不存在' });
          continue;
        }

        // Delete associated files
        await uploadService.deleteFile(
          work.filePath,
          work.thumbnailSmall || undefined,
          work.thumbnailLarge || undefined
        );

        // Remove from database (many-to-many relations will be cleaned automatically)
        await this.workRepo.remove(work);
        result.success.push(id);
      } catch (error: any) {
        result.failed.push({ id, reason: error.message });
      }
    }

    return result;
  }
}

export const batchService = new BatchService();