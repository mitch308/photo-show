import path from 'path';
import fs from 'fs';
import { imageService, ThumbnailResult, THUMBNAIL_SIZES } from './imageService.js';
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
  fileHash?: string;
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
  async processFile(file: Express.Multer.File, fileHash?: string): Promise<UploadResult> {
    if (isImageFile(file.mimetype)) {
      return this.processImage(file, fileHash);
    } else if (isVideoFile(file.mimetype)) {
      return this.processVideo(file, fileHash);
    }

    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  /**
   * Process multiple files in batch
   * Returns both successful results and any errors
   */
  async uploadMultipleFiles(files: Express.Multer.File[], fileHashes?: string[]): Promise<MultipleUploadResult> {
    const results: UploadResult[] = [];
    const errors: { filename: string; error: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const hash = fileHashes?.[i];
      try {
        const result = await this.processFile(file, hash);
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
   * Uses smart thumbnail generation to avoid creating thumbnails for small images
   */
  async processImage(file: Express.Multer.File, fileHash?: string): Promise<UploadResult> {
    const { dir, monthDir } = getUploadPath();
    
    // Use smart thumbnail generation
    const thumbnails = await imageService.generateSmartThumbnails(
      file.path,
      dir,
      file.originalname,
      fileHash
    );

    // Get watermark configuration
    const watermarkConfig = await settingsService.getWatermarkConfig();

    // Process small thumbnail
    let thumbnailSmallPath: string;
    if (thumbnails.smallIsOriginal) {
      // Small image - use original path without watermark
      thumbnailSmallPath = thumbnails.small;
    } else {
      thumbnailSmallPath = thumbnails.small;
      // Apply watermark to small thumbnail if enabled
      if (watermarkConfig.enabled && thumbnails.small) {
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
    }

    // Process large thumbnail
    let thumbnailLargePath: string | null;
    if (thumbnails.largeIsOriginal) {
      // Image is small enough - large thumbnail same as original, set to null to avoid redundancy
      thumbnailLargePath = null;
    } else {
      thumbnailLargePath = thumbnails.large;
      // Apply watermark to large thumbnail if enabled
      if (watermarkConfig.enabled && thumbnails.large) {
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

    // Build file path
    const filePath = fileHash 
      ? toUrlPath('uploads/works', monthDir, `${fileHash}${path.extname(file.originalname)}`)
      : toUrlPath('uploads/works', monthDir, file.filename);

    return {
      filePath,
      thumbnailSmall: toUrlPath('uploads/works', monthDir, path.basename(thumbnailSmallPath)),
      thumbnailLarge: thumbnailLargePath 
        ? toUrlPath('uploads/works', monthDir, path.basename(thumbnailLargePath))
        : null,
      originalFilename: file.originalname,
      fileType: 'image',
      mimeType: file.mimetype,
      fileSize: file.size,
      fileHash,
    };
  }

  /**
   * Process uploaded video: generate thumbnail
   */
  async processVideo(file: Express.Multer.File, fileHash?: string): Promise<UploadResult> {
    const { dir, monthDir } = getUploadPath();
    
    // Generate video thumbnail
    const thumbnail = await videoService.generateThumbnail(file.path, dir);

    // Build file path
    const filePath = fileHash 
      ? toUrlPath('uploads/works', monthDir, `${fileHash}${path.extname(file.originalname)}`)
      : toUrlPath('uploads/works', monthDir, file.filename);

    return {
      filePath,
      thumbnailSmall: toUrlPath('uploads/works', monthDir, path.basename(thumbnail)),
      thumbnailLarge: null, // No large thumbnail for video
      originalFilename: file.originalname,
      fileType: 'video',
      mimeType: file.mimetype,
      fileSize: file.size,
      fileHash,
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