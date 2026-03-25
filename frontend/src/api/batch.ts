import api from './index';
import type { ApiResponse } from './types';

/**
 * Batch operation result
 */
export interface BatchResult {
  success: string[];
  failed: { id: string; reason: string }[];
}

/**
 * Batch API client
 * Per BATCH-01~04: 批量操作 API
 */
export const batchApi = {
  /**
   * Batch update isPublic status for works
   * Per BATCH-02: 管理员可以批量修改作品的公开状态
   */
  async updateStatus(workIds: string[], isPublic: boolean): Promise<BatchResult> {
    const response = await api.post<ApiResponse<BatchResult>>('/batch/works/status', {
      workIds,
      isPublic,
    });
    return response.data.data;
  },

  /**
   * Batch move works to albums
   * Per BATCH-03: 管理员可以批量移动作品到相册
   * 
   * @param workIds - Work IDs to move
   * @param albumIds - Album IDs (null to remove from all albums)
   * @param mode - 'add' to add albums, 'set' to replace albums, 'remove' to remove albums
   */
  async moveToAlbum(
    workIds: string[],
    albumIds: string[] | null,
    mode: 'add' | 'set' | 'remove' = 'set'
  ): Promise<BatchResult> {
    const response = await api.post<ApiResponse<BatchResult>>('/batch/works/move', {
      workIds,
      albumIds: albumIds || [],
      mode,
    });
    return response.data.data;
  },

  /**
   * Batch delete works
   * Per BATCH-04: 管理员可以批量删除作品
   */
  async deleteWorks(workIds: string[]): Promise<BatchResult> {
    const response = await api.post<ApiResponse<BatchResult>>('/batch/works/delete', {
      workIds,
    });
    return response.data.data;
  },
};