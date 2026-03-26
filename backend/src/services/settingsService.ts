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
    return settings.value as WatermarkConfig;
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
        value: config as Record<string, unknown>
      });
    } else {
      settings.value = config as Record<string, unknown>;
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
}

export const settingsService = new SettingsService();