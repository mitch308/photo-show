import { Router, Request, Response } from 'express';
import { uploadImage, uploadVideo, uploadAny } from '../middlewares/upload.js';
import { uploadService } from '../services/uploadService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// All upload routes require authentication
router.use(authMiddleware);

/**
 * POST /api/upload
 * Upload a single file (image or video)
 * Backward compatible endpoint - automatically detects file type
 */
router.post('/', uploadAny.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'No file uploaded'));
      return;
    }

    const fileHash = req.body.fileHash || req.query.fileHash;
    const result = await uploadService.processFile(req.file, fileHash);
    res.json(successResponse(result, 'File uploaded successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

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

    const fileHash = req.body.fileHash || req.query.fileHash;
    const result = await uploadService.processImage(req.file, fileHash);
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

    const fileHash = req.body.fileHash || req.query.fileHash;
    const result = await uploadService.processVideo(req.file, fileHash);
    res.json(successResponse(result, 'Video uploaded successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple files (images and/or videos)
 * Returns array of results for each file, along with any errors
 */
router.post('/multiple', uploadAny.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'No files uploaded'));
      return;
    }

    // Extract file hashes from body (can be array or comma-separated string)
    let fileHashes: string[] | undefined;
    if (req.body.fileHashes) {
      fileHashes = Array.isArray(req.body.fileHashes) 
        ? req.body.fileHashes 
        : req.body.fileHashes.split(',').map((h: string) => h.trim());
    }

    const result = await uploadService.uploadMultipleFiles(files, fileHashes);
    res.json(successResponse(result, 
      result.success ? 'All files uploaded successfully' : 'Some files failed to upload'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/upload/multiple/images
 * Upload multiple image files
 */
router.post('/multiple/images', uploadImage.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'No files uploaded'));
      return;
    }

    // Extract file hashes from body (can be array or comma-separated string)
    let fileHashes: string[] | undefined;
    if (req.body.fileHashes) {
      fileHashes = Array.isArray(req.body.fileHashes) 
        ? req.body.fileHashes 
        : req.body.fileHashes.split(',').map((h: string) => h.trim());
    }

    const result = await uploadService.uploadMultipleFiles(files, fileHashes);
    res.json(successResponse(result, 
      result.success ? 'All images uploaded successfully' : 'Some images failed to upload'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;