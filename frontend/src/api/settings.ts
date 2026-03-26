import api from './index';
import type { ApiResponse } from './types';
import type { WatermarkConfig, StudioInfo } from '@/types/settings';

export const settingsApi = {
  async getWatermarkConfig(): Promise<WatermarkConfig> {
    const response = await api.get<ApiResponse<WatermarkConfig>>('/settings/watermark');
    return response.data.data;
  },

  async setWatermarkConfig(config: WatermarkConfig): Promise<WatermarkConfig> {
    const response = await api.put<ApiResponse<WatermarkConfig>>('/settings/watermark', config);
    return response.data.data;
  },

  async uploadWatermarkImage(file: File): Promise<{ imagePath: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse<{ imagePath: string }>>('/settings/watermark/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  async getStudioInfo(): Promise<StudioInfo> {
    const response = await api.get<ApiResponse<StudioInfo>>('/settings/studio');
    return response.data.data;
  },

  async setStudioInfo(info: StudioInfo): Promise<StudioInfo> {
    const response = await api.put<ApiResponse<StudioInfo>>('/settings/studio', info);
    return response.data.data;
  },

  async uploadStudioLogo(file: File): Promise<{ logoPath: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<ApiResponse<{ logoPath: string }>>('/settings/studio/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  }
};