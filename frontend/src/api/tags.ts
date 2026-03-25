import api from './index';
import type { ApiResponse, Tag } from './types';

export const tagsApi = {
  async getTags(): Promise<Tag[]> {
    const response = await api.get<ApiResponse<Tag[]>>('/tags');
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