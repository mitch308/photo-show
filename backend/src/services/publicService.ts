import { AppDataSource } from '../config/database.js';
import { Work } from '../models/Work.js';
import { Album } from '../models/Album.js';
import { Tag } from '../models/Tag.js';
import { Repository, Brackets } from 'typeorm';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface FilterOptions extends PaginationOptions {
  albumId?: string;
  tagId?: string;
}

export interface PaginatedResult<T> {
  works: T[];
  total: number;
  hasMore: boolean;
}

export interface AlbumWithCount {
  id: string;
  name: string;
  description?: string;
  coverPath: string;
  workCount: number;
}

export interface TagWithCount {
  id: string;
  name: string;
  workCount: number;
}

export class PublicService {
  private workRepo: Repository<Work>;
  private albumRepo: Repository<Album>;
  private tagRepo: Repository<Tag>;

  constructor() {
    this.workRepo = AppDataSource.getRepository(Work);
    this.albumRepo = AppDataSource.getRepository(Album);
    this.tagRepo = AppDataSource.getRepository(Tag);
  }

  /**
   * Get public works with optional filters and pagination
   */
  async getPublicWorks(options: FilterOptions = {}): Promise<PaginatedResult<Work>> {
    const { albumId, tagId, limit = 20, offset = 0 } = options;

    const queryBuilder = this.workRepo.createQueryBuilder('work')
      .leftJoinAndSelect('work.albums', 'albums')
      .leftJoinAndSelect('work.tags', 'tags')
      .leftJoinAndSelect('work.mediaItems', 'mediaItems')
      .where('work.isPublic = :isPublic', { isPublic: true });

    if (albumId) {
      queryBuilder.andWhere('albums.id = :albumId', { albumId });
    }

    if (tagId) {
      queryBuilder.andWhere('tags.id = :tagId', { tagId });
    }

    // Sort: pinned first, then by position, then media items by position
    queryBuilder.orderBy('work.isPinned', 'DESC')
      .addOrderBy('work.position', 'ASC')
      .addOrderBy('mediaItems.position', 'ASC');

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.take(limit).skip(offset);

    const works = await queryBuilder.getMany();

    // Calculate hasMore: offset + returned count < total
    const hasMore = offset + works.length < total;

    return { works, total, hasMore };
  }

  /**
   * Search public works by title or description
   */
  async searchPublicWorks(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Work>> {
    const { limit = 20, offset = 0 } = options;

    const queryBuilder = this.workRepo.createQueryBuilder('work')
      .leftJoinAndSelect('work.albums', 'albums')
      .leftJoinAndSelect('work.tags', 'tags')
      .leftJoinAndSelect('work.mediaItems', 'mediaItems')
      .where('work.isPublic = :isPublic', { isPublic: true })
      .andWhere(
        new Brackets(qb => {
          qb.where('work.title LIKE :query')
            .orWhere('work.description LIKE :query');
        })
      )
      .setParameters({ query: `%${query}%` })
      .orderBy('work.isPinned', 'DESC')
      .addOrderBy('work.position', 'ASC')
      .addOrderBy('mediaItems.position', 'ASC');

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.take(limit).skip(offset);

    const works = await queryBuilder.getMany();

    const hasMore = offset + works.length < total;

    return { works, total, hasMore };
  }

  /**
   * Get a single public work by ID
   */
  async getPublicWorkById(id: string): Promise<Work | null> {
    const work = await this.workRepo.findOne({
      where: { id, isPublic: true },
      relations: ['albums', 'tags', 'mediaItems'],
      order: {
        mediaItems: {
          position: 'ASC',
        },
      },
    });

    if (work) {
      // Increment view count
      await this.workRepo.increment({ id }, 'viewCount', 1);
    }

    return work;
  }

  /**
   * Get all albums with work count
   * Album cover uses first media item of first work, or falls back to album's coverPath
   */
  async getPublicAlbums(): Promise<AlbumWithCount[]> {
    // Get albums with their works (limited to first work for cover)
    const albums = await this.albumRepo.createQueryBuilder('album')
      .leftJoinAndSelect('album.works', 'work', 'work.isPublic = :isPublic', { isPublic: true })
      .leftJoinAndSelect('work.mediaItems', 'mediaItems')
      .orderBy('album.position', 'ASC')
      .addOrderBy('work.position', 'ASC')
      .addOrderBy('mediaItems.position', 'ASC')
      .getMany();

    return albums.map(album => {
      // Calculate work count (only public works)
      const publicWorks = (album.works || []).filter(w => w.isPublic);
      const workCount = publicWorks.length;

      // Determine cover path: first media item of first work, or album's coverPath
      let coverPath = album.coverPath;
      if (publicWorks.length > 0) {
        const firstWork = publicWorks[0];
        if (firstWork.mediaItems && firstWork.mediaItems.length > 0) {
          // Use first media item's small thumbnail as cover
          coverPath = firstWork.mediaItems[0].thumbnailSmall || firstWork.mediaItems[0].filePath;
        } else if (firstWork.thumbnailSmall) {
          // Fall back to work's legacy thumbnail
          coverPath = firstWork.thumbnailSmall;
        }
      }

      return {
        id: album.id,
        name: album.name,
        description: album.description,
        coverPath,
        workCount,
      };
    });
  }

  /**
   * Get all tags with public work count only
   */
  async getPublicTags(): Promise<TagWithCount[]> {
    const results = await this.tagRepo.createQueryBuilder('tag')
      .leftJoin('tag.works', 'work')
      .select('tag.id', 'id')
      .addSelect('tag.name', 'name')
      .addSelect('COUNT(work.id)', 'workCount')
      .where('work.isPublic = :isPublic', { isPublic: true })
      .groupBy('tag.id')
      .orderBy('tag.name', 'ASC')
      .getRawMany();

    return results.map(r => ({
      id: r.id,
      name: r.name,
      workCount: parseInt(r.workCount, 10) || 0,
    }));
  }
}

export const publicService = new PublicService();