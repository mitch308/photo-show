import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class VideoService {
  /**
   * Generate video thumbnail per D-04
   */
  async generateThumbnail(
    videoPath: string,
    outputDir: string
  ): Promise<string> {
    const uuid = uuidv4();
    const outputPath = path.join(outputDir, `${uuid}_thumb.jpg`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['50%'], // Take screenshot at 50% of video
          filename: `${uuid}_thumb.jpg`,
          folder: outputDir,
          size: '300x?' // Keep aspect ratio, width 300px
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err));
    });
  }

  /**
   * Get video metadata
   */
  async getMetadata(videoPath: string): Promise<{ duration: number; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
        });
      });
    });
  }
}

export const videoService = new VideoService();