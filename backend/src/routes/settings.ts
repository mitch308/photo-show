import { Router, Request, Response } from 'express';
import { settingsService, WatermarkConfig } from '../services/settingsService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Watermark image upload configuration
const watermarkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads/watermarks');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `watermark_${uuidv4()}${ext}`);
  }
});

const watermarkUpload = multer({ storage: watermarkStorage });

/**
 * GET /api/settings/watermark
 * Get watermark configuration
 */
router.get('/watermark', async (req: Request, res: Response) => {
  try {
    const config = await settingsService.getWatermarkConfig();
    res.json(successResponse(config));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * PUT /api/settings/watermark
 * Update watermark configuration
 */
router.put('/watermark', authMiddleware, async (req: Request, res: Response) => {
  try {
    const config: WatermarkConfig = req.body;

    // Validate required fields
    if (config.enabled && config.type === 'text' && !config.text) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, '文字水印需要提供文字内容'));
      return;
    }
    if (config.enabled && config.type === 'image' && !config.imagePath) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, '图片水印需要提供图片路径'));
      return;
    }

    await settingsService.setWatermarkConfig(config);
    res.json(successResponse(config, '水印配置已保存'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/settings/watermark/image
 * Upload watermark image
 */
router.post('/watermark/image', authMiddleware, watermarkUpload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, '请上传图片文件'));
      return;
    }

    const imagePath = `/uploads/watermarks/${req.file.filename}`;
    res.json(successResponse({ imagePath }, '水印图片上传成功'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;