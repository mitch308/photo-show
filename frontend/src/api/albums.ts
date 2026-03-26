import api from './index';
import type { ApiResponse, Album } from './types';

export const albumsApi = {
  async getAlbums(name?: string): Promise<Album[]> {
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    const url = params.toString() ? `/albums?${params.toString()}` : '/albums';
    const response = await api.get<ApiResponse<Album[]>>(url);
    return response.data.data;
  },

  async getAlbum(id: string): Promise<Album> {
    const response = await api.get<ApiResponse<Album>>(`/albums/${id}`);
    return response.data.data;
  },

  async createAlbum(data: Partial<Album>): Promise<Album> {
    const response = await api.post<ApiResponse<Album>>('/albums', data);
    return response.data.data;
  },

  async updateAlbum(id: string, data: Partial<Album>): Promise<Album> {
    const response = await api.put<ApiResponse<Album>>(`/albums/${id}`, data);
    return response.data.data;
  },

  async deleteAlbum(id: string, deleteWorks: boolean = false): Promise<void> {
    await api.delete(`/albums/${id}?deleteWorks=${deleteWorks}`);
  },

  async updatePositions(positions: { id: string; position: number }[]): Promise<void> {
    await api.put('/albums/positions', { positions });
  },
};