import { AppDataSource } from '../config/database.js';
import { Work } from '../models/Work.js';
import { Album } from '../models/Album.js';
import { ShareAccessLog } from '../models/ShareAccessLog.js';
import { Repository } from 'typeorm';

/**
 * Work statistics
 * Per STAT-01~02: 作品浏览/下载统计
 */
export interface WorkStats {
  id: string;
  title: string;
  thumbnailSmall: string;
  thumbnailLarge: string;
  fileType: string;
  viewCount: number;
  downloadCount: number;
  createdAt: Date;
}

/**
 * Album statistics
 * Per STAT-03: 相册浏览统计
 * Note: Album doesn't have viewCount, calculated from works
 */
export interface AlbumStats {
  id: string;
  name: string;
  coverPath: string;
  workCount: number;
  totalViews: number;
  totalDownloads: number;
}

/**
 * Overview statistics
 * Per STAT-04: 总览数据
 */
export interface OverviewStats {
  totalWorks: number;
  totalAlbums: number;
  totalTags: number;
  totalViews: number;
  totalDownloads: number;
  publicWorks: number;
  privateWorks: number;
  recentAccessCount: number; // Last 7 days
}

/**
 * Service for statistics operations
 * Per STAT-01~04: 作品/相册浏览下载统计
 */
export class StatsService {
  private workRepo: Repository<Work>;
  private albumRepo: Repository<Album>;
  private accessLogRepo: Repository<ShareAccessLog>;

  constructor() {
    this.workRepo = AppDataSource.getRepository(Work);
    this.albumRepo = AppDataSource.getRepository(Album);
    this.accessLogRepo = AppDataSource.getRepository(ShareAccessLog);
  }

  /**
   * Get work statistics
   * Per STAT-01: 管理员可以看到作品的浏览次数
   * Per STAT-02: 管理员可以看到作品的下载次数
   */
  async getWorkStats(options?: {
    sortBy?: 'viewCount' | 'downloadCount' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<{ stats: WorkStats[]; total: number }> {
    const sortBy = options?.sortBy || 'viewCount';
    const sortOrder = options?.sortOrder || 'DESC';
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const queryBuilder = this.workRepo.createQueryBuilder('work')
      .select([
        'work.id',
        'work.title',
        'work.thumbnailSmall',
        'work.thumbnailLarge',
        'work.fileType',
        'work.viewCount',
        'work.downloadCount',
        'work.createdAt',
      ])
      .orderBy(`work.${sortBy}`, sortOrder)
      .addOrderBy('work.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.take(limit).skip(offset);

    const works = await queryBuilder.getMany();

    const stats: WorkStats[] = works.map(work => ({
      id: work.id,
      title: work.title,
      thumbnailSmall: work.thumbnailSmall,
      thumbnailLarge: work.thumbnailLarge,
      fileType: work.fileType,
      viewCount: work.viewCount,
      downloadCount: work.downloadCount,
      createdAt: work.createdAt,
    }));

    return { stats, total };
  }

  /**
   * Get album statistics
   * Per STAT-03: 管理员可以看到相册的浏览次数
   * Note: Album viewCount calculated from works in album
   */
  async getAlbumStats(options?: {
    sortBy?: 'name' | 'workCount' | 'totalViews' | 'totalDownloads';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<{ stats: AlbumStats[]; total: number }> {
    const sortBy = options?.sortBy || 'totalViews';
    const sortOrder = options?.sortOrder || 'DESC';
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    // Query albums with aggregated work stats
    const queryBuilder = this.albumRepo.createQueryBuilder('album')
      .leftJoin('album.works', 'work')
      .select('album.id', 'id')
      .addSelect('album.name', 'name')
      .addSelect('album.coverPath', 'coverPath')
      .addSelect('COUNT(DISTINCT work.id)', 'workCount')
      .addSelect('COALESCE(SUM(work.viewCount), 0)', 'totalViews')
      .addSelect('COALESCE(SUM(work.downloadCount), 0)', 'totalDownloads')
      .groupBy('album.id');

    // Get total count first
    const totalResult = await this.albumRepo.count();

    // Get results
    const results = await queryBuilder.getRawMany();

    // Sort in memory (since sorting by aggregated columns is tricky)
    const sortedResults = results.sort((a, b) => {
      let aVal: number = a[sortBy] as number;
      let bVal: number = b[sortBy] as number;

      if (sortBy === 'workCount' || sortBy === 'totalViews' || sortBy === 'totalDownloads') {
        aVal = parseInt(String(a[sortBy]), 10) || 0;
        bVal = parseInt(String(b[sortBy]), 10) || 0;
      } else {
        // String comparison for name
        aVal = 0;
        bVal = 0;
        const aStr = String(a[sortBy]);
        const bStr = String(b[sortBy]);
        if (sortOrder === 'DESC') {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        } else {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        }
      }

      if (sortOrder === 'DESC') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    // Apply pagination
    const paginatedResults = sortedResults.slice(offset, offset + limit);

    const stats: AlbumStats[] = paginatedResults.map(r => ({
      id: r.id,
      name: r.name,
      coverPath: r.coverPath,
      workCount: parseInt(r.workCount, 10) || 0,
      totalViews: parseInt(r.totalViews, 10) || 0,
      totalDownloads: parseInt(r.totalDownloads, 10) || 0,
    }));

    return { stats, total: totalResult };
  }

  /**
   * Get overview statistics
   * Per STAT-04: 浏览和下载次数在管理后台可见
   */
  async getOverviewStats(): Promise<OverviewStats> {
    // Get work counts
    const totalWorks = await this.workRepo.count();
    const publicWorks = await this.workRepo.count({ where: { isPublic: true } });
    const privateWorks = totalWorks - publicWorks;

    // Get album and tag counts
    const totalAlbums = await this.albumRepo.count();

    // Import Tag repository
    const tagRepo = AppDataSource.getRepository('Tag');
    const totalTags = await tagRepo.count();

    // Get total views and downloads
    const viewResult = await this.workRepo
      .createQueryBuilder('work')
      .select('SUM(work.viewCount)', 'totalViews')
      .addSelect('SUM(work.downloadCount)', 'totalDownloads')
      .getRawOne();

    // Get recent access count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAccessCount = await this.accessLogRepo
      .createQueryBuilder('log')
      .where('log.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    return {
      totalWorks,
      totalAlbums,
      totalTags,
      totalViews: parseInt(viewResult?.totalViews || '0', 10),
      totalDownloads: parseInt(viewResult?.totalDownloads || '0', 10),
      publicWorks,
      privateWorks,
      recentAccessCount,
    };
  }
}

export const statsService = new StatsService();