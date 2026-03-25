import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface ThumbnailResult {
  small: string;   // 300px
  large: string;   // 1200px
}

export interface WatermarkOptions {
  text?: string;
  imagePath?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number; // 0-1
}

export class ImageService {
  /**
   * Generate thumbnails per D-05: 300px and 1200px
   */
  async generateThumbnails(
    inputPath: string,
    outputDir: string,
    originalName: string
  ): Promise<ThumbnailResult> {
    const ext = path.extname(originalName);
    const uuid = uuidv4();

    const smallPath = path.join(outputDir, `${uuid}_small${ext}`);
    const largePath = path.join(outputDir, `${uuid}_large${ext}`);

    // Generate 300px thumbnail
    await sharp(inputPath)
      .resize(300, undefined, { fit: 'inside' })
      .toFile(smallPath);

    // Generate 1200px thumbnail
    await sharp(inputPath)
      .resize(1200, undefined, { fit: 'inside' })
      .toFile(largePath);

    return {
      small: smallPath,
      large: largePath,
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