import path from 'path';
import fs from 'fs';
import { imageService, ThumbnailResult } from './imageService.js';
import { videoService } from './videoService.js';
import { getUploadPath } from '../config/storage.js';
import { settingsService, WatermarkConfig } from './settingsService.js';

export interface UploadResult {
  filePath: string;
  thumbnailSmall: string | null;
  thumbnailLarge: string | null;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
}

export interface MultipleUploadResult {
  success: boolean;
  results: UploadResult[];
  errors: { filename: string; error: string }[];
}

function toUrlPath(...parts: string[]): string {
  return parts.join('/');
}

/**
 * Determine if file is an image based on mime type
 */
function isImageFile(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}

/**
 * Determine if file is a video based on mime type
 */
function isVideoFile(mimetype: string): boolean {
  return mimetype.startsWith('video/');
}

export class UploadService {
  /**
   * Process a single file (image or video)
   * Automatically detects file type and processes accordingly
   */
  async processFile(file: Express.Multer.File): Promise<UploadResult> {
    if (isImageFile(file.mimetype)) {
      return this.processImage(file);
    } else if (isVideoFile(file.mimetype)) {
      return this.processVideo(file);
    }

    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  /**
   * Process multiple files in batch
   * Returns both successful results and any errors
   */
  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<MultipleUploadResult> {
    const results: UploadResult[] = [];
    const errors: { filename: string; error: string }[] = [];

    for (const file of files) {
      try {
        const result = await this.processFile(file);
        results.push(result);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }

  /**
   * Process uploaded image: generate thumbnails with optional watermark
   */
  async processImage(file: Express.Multer.File): Promise<UploadResult> {
    const { dir, monthDir } = getUploadPath();
    
    // Generate thumbnails
    const thumbnails = await imageService.generateThumbnails(
      file.path,
      dir,
      file.originalname
    );

    // Get watermark configuration
    const watermarkConfig = await settingsService.getWatermarkConfig();

    // Apply watermark to thumbnails if enabled
    if (watermarkConfig.enabled) {
      // Apply watermark to small thumbnail
      if (thumbnails.small) {
        const wmSmallPath = thumbnails.small.replace('_small', '_small_wm');
        await imageService.addWatermark(thumbnails.small, wmSmallPath, {
          text: watermarkConfig.type === 'text' ? watermarkConfig.text : undefined,
          imagePath: watermarkConfig.type === 'image' ? watermarkConfig.imagePath : undefined,
          position: watermarkConfig.position,
          opacity: watermarkConfig.opacity
        });
        // Replace original with watermarked version
        fs.unlinkSync(thumbnails.small);
        fs.renameSync(wmSmallPath, thumbnails.small);
      }

      // Apply watermark to large thumbnail
      if (thumbnails.large) {
        const wmLargePath = thumbnails.large.replace('_large', '_large_wm');
        await imageService.addWatermark(thumbnails.large, wmLargePath, {
          text: watermarkConfig.type === 'text' ? watermarkConfig.text : undefined,
          imagePath: watermarkConfig.type === 'image' ? watermarkConfig.imagePath : undefined,
          position: watermarkConfig.position,
          opacity: watermarkConfig.opacity
        });
        // Replace original with watermarked version
        fs.unlinkSync(thumbnails.large);
        fs.renameSync(wmLargePath, thumbnails.large);
      }
    }

    return {
      filePath: toUrlPath('uploads/works', monthDir, file.filename),
      thumbnailSmall: toUrlPath('uploads/works', monthDir, path.basename(thumbnails.small)),
      thumbnailLarge: toUrlPath('uploads/works', monthDir, path.basename(thumbnails.large)),
      originalFilename: file.originalname,
      fileType: 'image',
      mimeType: file.mimetype,
      fileSize: file.size,
    };
  }

  /**
   * Process uploaded video: generate thumbnail
   */
  async processVideo(file: Express.Multer.File): Promise<UploadResult> {
    const { dir, monthDir } = getUploadPath();
    
    // Generate video thumbnail
    const thumbnail = await videoService.generateThumbnail(file.path, dir);

    return {
      filePath: toUrlPath('uploads/works', monthDir, file.filename),
      thumbnailSmall: toUrlPath('uploads/works', monthDir, path.basename(thumbnail)),
      thumbnailLarge: null, // No large thumbnail for video
      originalFilename: file.originalname,
      fileType: 'video',
      mimeType: file.mimetype,
      fileSize: file.size,
    };
  }

  /**
   * Delete file and associated thumbnails
   */
  async deleteFile(filePath: string, thumbnailSmall?: string, thumbnailLarge?: string): Promise<void> {
    const files = [filePath, thumbnailSmall, thumbnailLarge].filter(Boolean) as string[];
    
    for (const file of files) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }
}

export const uploadService = new UploadService();