import { Router, Request, Response } from 'express';
import { uploadImage, uploadVideo } from '../middlewares/upload.js';
import { uploadService } from '../services/uploadService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// All upload routes require authentication
router.use(authMiddleware);

/**
 * POST /api/upload/image
 * Upload an image file
 */
router.post('/image', uploadImage.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'No file uploaded'));
      return;
    }

    const result = await uploadService.processImage(req.file);
    res.json(successResponse(result, 'Image uploaded successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/upload/video
 * Upload a video file
 */
router.post('/video', uploadVideo.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'No file uploaded'));
      return;
    }

    const result = await uploadService.processVideo(req.file);
    res.json(successResponse(result, 'Video uploaded successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;