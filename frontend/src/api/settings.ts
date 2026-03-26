import api from './index';
import type { ApiResponse } from './types';
import type { WatermarkConfig } from '@/types/settings';

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
  }
};