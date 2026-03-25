import api from './index';
import type { ApiResponse, Work } from './types';

export interface ShareData {
  token: string;
  expiresAt: number;
  works: Work[];
}

export interface CreateShareRequest {
  workIds: string[];
  expiresInDays?: number;
}

export interface ShareInfo {
  token: string;
  workIds: string[];
  expiresAt: number;
  createdAt: number;
  shareUrl?: string;
}

export const shareApi = {
  // Public endpoints (no auth)
  async getShare(token: string): Promise<ShareData> {
    const response = await api.get<ApiResponse<ShareData>>(`/share/${token}`);
    return response.data.data;
  },

  getDownloadUrl(token: string, workId: string): string {
    return `${api.defaults.baseURL}/share/${token}/download/${workId}`;
  },

  // Admin endpoints (require auth)
  async createShare(data: CreateShareRequest): Promise<ShareInfo> {
    const response = await api.post<ApiResponse<ShareInfo>>('/admin/share', data);
    return response.data.data;
  },

  async getShares(): Promise<ShareInfo[]> {
    const response = await api.get<ApiResponse<ShareInfo[]>>('/admin/share');
    return response.data.data;
  },

  async getShareInfo(token: string): Promise<ShareInfo> {
    const response = await api.get<ApiResponse<ShareInfo>>(`/admin/share/${token}`);
    return response.data.data;
  },

  async revokeShare(token: string): Promise<void> {
    await api.delete(`/admin/share/${token}`);
  }
};