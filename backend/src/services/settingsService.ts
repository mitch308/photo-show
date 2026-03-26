import { AppDataSource } from '../config/database.js';
import { SystemSettings } from '../models/SystemSettings.js';
import { Repository } from 'typeorm';

export interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  text?: string;
  imagePath?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
}

export interface StudioInfo {
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;  // HTML 富文本
}

export class SettingsService {
  private repo: Repository<SystemSettings>;

  constructor() {
    this.repo = AppDataSource.getRepository(SystemSettings);
  }

  /**
   * Get watermark configuration. Returns defaults if not configured.
   */
  async getWatermarkConfig(): Promise<WatermarkConfig> {
    const settings = await this.repo.findOne({
      where: { key: 'watermark' }
    });
    if (!settings) {
      return this.getDefaultWatermarkConfig();
    }
    return settings.value as unknown as WatermarkConfig;
  }

  /**
   * Save watermark configuration.
   */
  async setWatermarkConfig(config: WatermarkConfig): Promise<void> {
    let settings = await this.repo.findOne({
      where: { key: 'watermark' }
    });
    if (!settings) {
      settings = this.repo.create({
        key: 'watermark',
        value: config as unknown as Record<string, unknown>
      });
    } else {
      settings.value = config as unknown as Record<string, unknown>;
    }
    await this.repo.save(settings);
  }

  private getDefaultWatermarkConfig(): WatermarkConfig {
    return {
      enabled: false,
      type: 'text',
      text: '',
      position: 'bottom-right',
      opacity: 0.5
    };
  }

  /**
   * Get studio information. Returns defaults if not configured.
   */
  async getStudioInfo(): Promise<StudioInfo> {
    const settings = await this.repo.findOne({
      where: { key: 'studio_info' }
    });
    if (!settings) {
      return this.getDefaultStudioInfo();
    }
    return settings.value as unknown as StudioInfo;
  }

  /**
   * Save studio information.
   */
  async setStudioInfo(info: StudioInfo): Promise<void> {
    let settings = await this.repo.findOne({
      where: { key: 'studio_info' }
    });
    if (!settings) {
      settings = this.repo.create({
        key: 'studio_info',
        value: info as unknown as Record<string, unknown>
      });
    } else {
      settings.value = info as unknown as Record<string, unknown>;
    }
    await this.repo.save(settings);
  }

  private getDefaultStudioInfo(): StudioInfo {
    return {
      name: '',
      phone: '',
      email: '',
      address: '',
      description: ''
    };
  }
}

export const settingsService = new SettingsService();