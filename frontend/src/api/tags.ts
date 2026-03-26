import api from './index';
import type { ApiResponse, Tag } from './types';

export const tagsApi = {
  async getTags(q?: string): Promise<Tag[]> {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    const url = params.toString() ? `/tags?${params.toString()}` : '/tags';
    const response = await api.get<ApiResponse<Tag[]>>(url);
    return response.data.data;
  },

  async createTag(name: string): Promise<Tag> {
    const response = await api.post<ApiResponse<Tag>>('/tags', { name });
    return response.data.data;
  },

  async updateTag(id: string, name: string): Promise<Tag> {
    const response = await api.put<ApiResponse<Tag>>(`/tags/${id}`, { name });
    return response.data.data;
  },

  async deleteTag(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },
};