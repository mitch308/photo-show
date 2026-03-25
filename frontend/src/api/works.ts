import api from './index';
import type { ApiResponse, Work } from './types';

export const worksApi = {
  async getWorks(filters?: { albumId?: string; tagId?: string; isPublic?: boolean }): Promise<Work[]> {
    const params = new URLSearchParams();
    if (filters?.albumId) params.append('albumId', filters.albumId);
    if (filters?.tagId) params.append('tagId', filters.tagId);
    if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));
    
    const response = await api.get<ApiResponse<Work[]>>(`/works?${params.toString()}`);
    return response.data.data;
  },

  async getWork(id: string): Promise<Work> {
    const response = await api.get<ApiResponse<Work>>(`/works/${id}`);
    return response.data.data;
  },

  async createWork(data: Partial<Work>): Promise<Work> {
    const response = await api.post<ApiResponse<Work>>('/works', data);
    return response.data.data;
  },

  async updateWork(id: string, data: Partial<Work>): Promise<Work> {
    const response = await api.put<ApiResponse<Work>>(`/works/${id}`, data);
    return response.data.data;
  },

  async deleteWork(id: string): Promise<void> {
    await api.delete(`/works/${id}`);
  },

  async updatePositions(positions: { id: string; position: number }[]): Promise<void> {
    await api.put('/works/positions', { positions });
  },
};