import api from './index';
import type { ApiResponse, Work, Album } from './types';

/**
 * Work statistics item
 */
export interface WorkStatsItem extends Pick<Work, 'id' | 'title' | 'viewCount' | 'downloadCount' | 'createdAt'> {
  thumbnailSmall: string | null;
  fileType: 'image' | 'video';
}

/**
 * Work statistics response
 */
export interface WorkStatsResponse {
  items: WorkStatsItem[];
  total: number;
}

/**
 * Album statistics item
 */
export interface AlbumStatsItem {
  id: string;
  name: string;
  workCount: number;
  totalViews: number;
  totalDownloads: number;
  coverPath: string | null;
}

/**
 * Album statistics response
 */
export interface AlbumStatsResponse {
  items: AlbumStatsItem[];
  total: number;
}

/**
 * Overview statistics
 */
export interface OverviewStats {
  totalWorks: number;
  totalAlbums: number;
  totalTags: number;
  totalViews: number;
  totalDownloads: number;
  publicWorks: number;
  privateWorks: number;
  imageWorks: number;
  videoWorks: number;
}

/**
 * Statistics API client
 * Per STAT-01~04: 统计 API
 */
export const statsApi = {
  /**
   * Get work statistics
   * Per STAT-01~02: 作品浏览下载统计
   */
  async getWorksStats(options?: {
    sortBy?: 'viewCount' | 'downloadCount' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<WorkStatsResponse> {
    const params = new URLSearchParams();
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await api.get<ApiResponse<WorkStatsResponse>>(`/stats/works?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get album statistics
   * Per STAT-03: 相册浏览统计
   */
  async getAlbumsStats(options?: {
    sortBy?: 'name' | 'workCount' | 'totalViews' | 'totalDownloads';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<AlbumStatsResponse> {
    const params = new URLSearchParams();
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await api.get<ApiResponse<AlbumStatsResponse>>(`/stats/albums?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get overview statistics
   * Per STAT-04: 总览数据
   */
  async getOverview(): Promise<OverviewStats> {
    const response = await api.get<ApiResponse<OverviewStats>>('/stats/overview');
    return response.data.data;
  },
};