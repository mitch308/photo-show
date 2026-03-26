import api from './index';
import type { ApiResponse, MediaItem, MediaCheckResult } from './types';

export const mediaItemsApi = {
  /**
   * Check if a file with the given hash already exists
   */
  async checkFileHash(hash: string): Promise<MediaCheckResult> {
    const response = await api.get<ApiResponse<MediaCheckResult>>(
      `/media/check`,
      { params: { hash } }
    );
    return response.data.data;
  },

  /**
   * Add a media item to a work
   */
  async addMediaItem(workId: string, data: {
    filePath: string;
    thumbnailSmall?: string | null;
    thumbnailLarge?: string | null;
    originalFilename: string;
    fileType: 'image' | 'video';
    mimeType: string;
    fileSize: number;
    fileHash?: string;
  }): Promise<MediaItem> {
    const response = await api.post<ApiResponse<MediaItem>>(
      `/works/${workId}/media`,
      data
    );
    return response.data.data;
  },

  /**
   * Get all media items for a work
   */
  async getMediaItems(workId: string): Promise<MediaItem[]> {
    const response = await api.get<ApiResponse<MediaItem[]>>(
      `/works/${workId}/media`
    );
    return response.data.data;
  },

  /**
   * Update a media item
   */
  async updateMediaItem(id: string, data: Partial<MediaItem>): Promise<MediaItem> {
    const response = await api.put<ApiResponse<MediaItem>>(
      `/media/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete a media item
   */
  async deleteMediaItem(id: string): Promise<void> {
    await api.delete(`/media/${id}`);
  },

  /**
   * Reorder media items within a work
   */
  async reorderMediaItems(workId: string, itemIds: string[]): Promise<void> {
    await api.put(`/works/${workId}/media/reorder`, { itemIds });
  },
};