import path from 'path';
import fs from 'fs';
import { imageService, ThumbnailResult } from './imageService.js';
import { videoService } from './videoService.js';
import { getUploadPath } from '../config/storage.js';

export interface UploadResult {
  filePath: string;
  thumbnailSmall: string | null;
  thumbnailLarge: string | null;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
}

export class UploadService {
  /**
   * Process uploaded image: generate thumbnails
   */
  async processImage(file: Express.Multer.File): Promise<UploadResult> {
    const { dir, monthDir } = getUploadPath();
    
    // Generate thumbnails
    const thumbnails = await imageService.generateThumbnails(
      file.path,
      dir,
      file.originalname
    );

    return {
      filePath: path.join('uploads/works', monthDir, file.filename),
      thumbnailSmall: path.join('uploads/works', monthDir, path.basename(thumbnails.small)),
      thumbnailLarge: path.join('uploads/works', monthDir, path.basename(thumbnails.large)),
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
      filePath: path.join('uploads/works', monthDir, file.filename),
      thumbnailSmall: path.join('uploads/works', monthDir, path.basename(thumbnail)),
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