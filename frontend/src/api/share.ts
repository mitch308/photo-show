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
  maxAccess?: number;
  clientId?: string;
}

export interface ShareInfo {
  token: string;
  workIds: string[];
  expiresAt: number;
  createdAt: number;
  shareUrl?: string;
  maxAccess?: number;
  accessCount?: number;
  clientId?: string;
}

export interface AccessLogEntry {
  id: string;
  token: string;
  workId: string;
  action: 'view' | 'download';
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AccessLogResult {
  logs: AccessLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export const shareApi = {
  // Public endpoints (no auth)
  async getShare(token: string): Promise<ShareData> {
    const response = await api.get<ApiResponse<ShareData>>(`/share/${token}`);
    return response.data.data;
  },

  getDownloadUrl(token: string, workId: string, mediaId?: string): string {
    if (mediaId) {
      return `${api.defaults.baseURL}/share/${token}/download/${workId}/media/${mediaId}`;
    }
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
  },

  async updateShare(token: string, data: {
    maxAccess?: number;
    clientId?: string;
  }): Promise<ShareInfo> {
    const response = await api.put<ApiResponse<ShareInfo>>(
      `/admin/share/${token}`,
      data
    );
    return response.data.data;
  },

  async getAccessLogs(token: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<AccessLogResult> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    
    const response = await api.get<ApiResponse<AccessLogResult>>(
      `/admin/share/${token}/access-logs?${params.toString()}`
    );
    return response.data.data;
  }
};