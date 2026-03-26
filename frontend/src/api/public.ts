import api from './index';
import type { ApiResponse, Work, Album, Tag } from './types';

export interface PublicWorksResponse {
  works: Work[];
  total: number;
  hasMore: boolean;
}

export interface PublicWorksFilters {
  albumId?: string;
  tagId?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export const publicApi = {
  async getWorks(filters?: PublicWorksFilters): Promise<PublicWorksResponse> {
    const params = new URLSearchParams();
    if (filters?.albumId) params.append('albumId', filters.albumId);
    if (filters?.tagId) params.append('tagId', filters.tagId);
    if (filters?.q) params.append('q', filters.q);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));
    
    const response = await api.get<ApiResponse<PublicWorksResponse>>(`/public/works?${params.toString()}`);
    return response.data.data;
  },

  async getWork(id: string): Promise<Work> {
    const response = await api.get<ApiResponse<Work>>(`/public/works/${id}`);
    return response.data.data;
  },

  async getAlbums(): Promise<Album[]> {
    const response = await api.get<ApiResponse<Album[]>>('/public/albums');
    return response.data.data;
  },

  async getTags(): Promise<Tag[]> {
    const response = await api.get<ApiResponse<Tag[]>>('/public/tags');
    return response.data.data;
  },

  /**
   * Record a view for a public work (increments view count)
   */
  async recordView(id: string): Promise<void> {
    await api.post(`/public/works/${id}/view`);
  }
};