import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Thumbnail size constants per D-05
 */
export const THUMBNAIL_SIZES = {
  SMALL: 300,
  LARGE: 1200,
};

export interface ThumbnailResult {
  small: string;           // 缩略图路径或原图路径
  large: string;           // 缩略图路径或原图路径
  smallIsOriginal: boolean; // small 是否为原图
  largeIsOriginal: boolean; // large 是否为原图
}

export interface WatermarkOptions {
  text?: string;
  imagePath?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number; // 0-1
}

export class ImageService {
  /**
   * 检查是否需要生成指定尺寸的缩略图
   * @param imageWidth 原图宽度
   * @param targetSize 目标缩略图尺寸
   * @returns true 表示需要生成，false 表示可以使用原图
   */
  shouldGenerateThumbnail(imageWidth: number, targetSize: number): boolean {
    return imageWidth > targetSize;
  }

  /**
   * 智能生成缩略图
   * - 图片宽度 <= 目标尺寸时不生成，返回原图路径
   * - 图片宽度 > 目标尺寸时生成缩略图
   */
  async generateSmartThumbnails(
    inputPath: string,
    outputDir: string,
    originalName: string,
    fileHash?: string
  ): Promise<ThumbnailResult> {
    const ext = path.extname(originalName);
    const uuid = fileHash || uuidv4();

    // 获取原图尺寸
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const width = metadata.width || 0;

    const result: ThumbnailResult = {
      small: '',
      large: '',
      smallIsOriginal: false,
      largeIsOriginal: false,
    };

    // Small thumbnail (300px)
    if (this.shouldGenerateThumbnail(width, THUMBNAIL_SIZES.SMALL)) {
      const smallPath = path.join(outputDir, `${uuid}_small${ext}`);
      await sharp(inputPath)
        .resize(THUMBNAIL_SIZES.SMALL, undefined, { fit: 'inside' })
        .toFile(smallPath);
      result.small = smallPath;
      result.smallIsOriginal = false;
    } else {
      // 图片太小，使用原图
      result.small = inputPath;
      result.smallIsOriginal = true;
    }

    // Large thumbnail (1200px)
    if (this.shouldGenerateThumbnail(width, THUMBNAIL_SIZES.LARGE)) {
      const largePath = path.join(outputDir, `${uuid}_large${ext}`);
      await sharp(inputPath)
        .resize(THUMBNAIL_SIZES.LARGE, undefined, { fit: 'inside' })
        .toFile(largePath);
      result.large = largePath;
      result.largeIsOriginal = false;
    } else {
      // 图片太小，使用原图
      result.large = inputPath;
      result.largeIsOriginal = true;
    }

    return result;
  }

  /**
   * Generate thumbnails per D-05: 300px and 1200px
   * @deprecated Use generateSmartThumbnails instead
   */
  async generateThumbnails(
    inputPath: string,
    outputDir: string,
    originalName: string
  ): Promise<{ small: string; large: string }> {
    const result = await this.generateSmartThumbnails(inputPath, outputDir, originalName);
    return {
      small: result.small,
      large: result.large,
    };
  }

  /**
   * Add watermark per D-06, D-07, D-08, D-09
   */
  async addWatermark(
    inputPath: string,
    outputPath: string,
    options: WatermarkOptions
  ): Promise<string> {
    const image = sharp(inputPath);
    const { width, height } = await image.metadata();

    if (!width || !height) {
      throw new Error('Unable to get image dimensions');
    }

    if (options.imagePath && fs.existsSync(options.imagePath)) {
      // Image watermark
      let watermark = sharp(options.imagePath);
      const wmMeta = await watermark.metadata();
      
      if (!wmMeta.width || !wmMeta.height) {
        throw new Error('Unable to get watermark dimensions');
      }
      
      // Resize watermark to fit
      const maxW = Math.floor(width * 0.3);
      const maxH = Math.floor(height * 0.3);
      if (wmMeta.width > maxW || wmMeta.height > maxH) {
        watermark = watermark.resize(maxW, maxH, { fit: 'inside' });
      }

      const wmBuffer = await watermark.toBuffer();
      const position = this.getWatermarkPosition(width, height, wmMeta.width, wmMeta.height, options.position);
      
      await sharp(inputPath)
        .composite([{ input: wmBuffer, ...position }])
        .toFile(outputPath);
    } else if (options.text) {
      // Text watermark using SVG
      const svg = this.createTextWatermark(options.text, options.opacity, width, height, options.position);
      await sharp(inputPath)
        .composite([{ input: Buffer.from(svg) }])
        .toFile(outputPath);
    } else {
      // No watermark, just copy
      await sharp(inputPath).toFile(outputPath);
    }

    return outputPath;
  }

  private getWatermarkPosition(
    imgW: number,
    imgH: number,
    wmW: number,
    wmH: number,
    position: string
  ): { top?: number; left?: number; bottom?: number; right?: number } {
    const padding = 20;
    switch (position) {
      case 'top-left':
        return { top: padding, left: padding };
      case 'top-right':
        return { top: padding, right: padding };
      case 'bottom-left':
        return { bottom: padding, left: padding };
      case 'bottom-right':
        return { bottom: padding, right: padding };
      case 'center':
        return { top: Math.floor((imgH - wmH) / 2), left: Math.floor((imgW - wmW) / 2) };
      default:
        return { bottom: padding, right: padding };
    }
  }

  private createTextWatermark(text: string, opacity: number, width: number, height: number, position: string): string {
    const fontSize = Math.min(width / 20, 48);
    const x = position.includes('right') ? width - 100 : 50;
    const y = position.includes('top') ? 50 : height - 50;
    
    return `<svg width="${width}" height="${height}">
      <text x="${x}" y="${y}" 
            font-size="${fontSize}" 
            fill="white" 
            fill-opacity="${opacity}"
            font-family="Arial">${text}</text>
    </svg>`;
  }
}

export const imageService = new ImageService();