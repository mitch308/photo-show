import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ImageService, THUMBNAIL_SIZES } from './imageService.js';

describe('ImageService - Smart Thumbnails', () => {
  const testDir = path.join(process.cwd(), 'test-uploads-smart');
  const smallImagePath = path.join(testDir, 'small.png');
  const mediumImagePath = path.join(testDir, 'medium.png');
  const largeImagePath = path.join(testDir, 'large.png');

  const imageService = new ImageService();

  beforeAll(async () => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create test images of different sizes
    await sharp({ create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 0, b: 0 } } })
      .png()
      .toFile(smallImagePath);

    await sharp({ create: { width: 600, height: 600, channels: 3, background: { r: 0, g: 255, b: 0 } } })
      .png()
      .toFile(mediumImagePath);

    await sharp({ create: { width: 1500, height: 1500, channels: 3, background: { r: 0, g: 0, b: 255 } } })
      .png()
      .toFile(largeImagePath);
  });

  afterAll(() => {
    // Cleanup test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('shouldGenerateThumbnail', () => {
    it('should return false when image width <= target size', () => {
      expect(imageService.shouldGenerateThumbnail(200, THUMBNAIL_SIZES.SMALL)).toBe(false);
      expect(imageService.shouldGenerateThumbnail(300, THUMBNAIL_SIZES.SMALL)).toBe(false);
      expect(imageService.shouldGenerateThumbnail(1000, THUMBNAIL_SIZES.LARGE)).toBe(false);
      expect(imageService.shouldGenerateThumbnail(1200, THUMBNAIL_SIZES.LARGE)).toBe(false);
    });

    it('should return true when image width > target size', () => {
      expect(imageService.shouldGenerateThumbnail(400, THUMBNAIL_SIZES.SMALL)).toBe(true);
      expect(imageService.shouldGenerateThumbnail(1500, THUMBNAIL_SIZES.LARGE)).toBe(true);
      expect(imageService.shouldGenerateThumbnail(2000, THUMBNAIL_SIZES.LARGE)).toBe(true);
    });
  });

  describe('generateSmartThumbnails', () => {
    it('should return original for small images (width <= 300)', async () => {
      const result = await imageService.generateSmartThumbnails(
        smallImagePath,
        testDir,
        'small.png'
      );

      expect(result.smallIsOriginal).toBe(true);
      expect(result.largeIsOriginal).toBe(true);
      expect(result.small).toBe(smallImagePath);
      expect(result.large).toBe(smallImagePath);
    });

    it('should generate small thumbnail for medium images (300 < width <= 1200)', async () => {
      const result = await imageService.generateSmartThumbnails(
        mediumImagePath,
        testDir,
        'medium.png'
      );

      expect(result.smallIsOriginal).toBe(false);
      expect(result.largeIsOriginal).toBe(true);
      expect(result.small).not.toBe(mediumImagePath);
      expect(result.large).toBe(mediumImagePath);

      // Verify small thumbnail was created
      expect(fs.existsSync(result.small)).toBe(true);

      // Cleanup generated thumbnail
      if (fs.existsSync(result.small)) {
        fs.unlinkSync(result.small);
      }
    });

    it('should generate both thumbnails for large images (width > 1200)', async () => {
      const result = await imageService.generateSmartThumbnails(
        largeImagePath,
        testDir,
        'large.png'
      );

      expect(result.smallIsOriginal).toBe(false);
      expect(result.largeIsOriginal).toBe(false);
      expect(result.small).not.toBe(largeImagePath);
      expect(result.large).not.toBe(largeImagePath);

      // Verify thumbnails were created
      expect(fs.existsSync(result.small)).toBe(true);
      expect(fs.existsSync(result.large)).toBe(true);

      // Verify thumbnail sizes
      const smallMeta = await sharp(result.small).metadata();
      const largeMeta = await sharp(result.large).metadata();

      expect(smallMeta.width).toBeLessThanOrEqual(THUMBNAIL_SIZES.SMALL);
      expect(largeMeta.width).toBeLessThanOrEqual(THUMBNAIL_SIZES.LARGE);

      // Cleanup generated thumbnails
      if (fs.existsSync(result.small)) {
        fs.unlinkSync(result.small);
      }
      if (fs.existsSync(result.large)) {
        fs.unlinkSync(result.large);
      }
    });

    it('should use provided fileHash for naming', async () => {
      const customHash = 'custom-test-hash-123';
      const result = await imageService.generateSmartThumbnails(
        largeImagePath,
        testDir,
        'large.png',
        customHash
      );

      // For large images, check the filename contains the hash
      expect(result.small).toContain(customHash);
      expect(result.large).toContain(customHash);

      // Cleanup generated thumbnails
      if (fs.existsSync(result.small)) {
        fs.unlinkSync(result.small);
      }
      if (fs.existsSync(result.large)) {
        fs.unlinkSync(result.large);
      }
    });
  });

  describe('generateThumbnails (backward compatibility)', () => {
    it('should work as alias for generateSmartThumbnails', async () => {
      const result = await imageService.generateThumbnails(
        mediumImagePath,
        testDir,
        'medium.png'
      );

      // Should return simple object without isOriginal flags
      expect(result.small).toBeDefined();
      expect(result.large).toBeDefined();
      expect(result.small).not.toBe(mediumImagePath); // 600 > 300, so thumbnail generated
      expect(result.large).toBe(mediumImagePath); // 600 <= 1200, so original used

      // Cleanup generated thumbnail
      if (fs.existsSync(result.small)) {
        fs.unlinkSync(result.small);
      }
    });
  });
});