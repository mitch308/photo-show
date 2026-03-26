import { Router, Request, Response } from 'express';
import { mediaItemService, CreateMediaItemData, UpdateMediaItemData } from '../services/mediaItemService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/media/check
 * Check if a file with the given hash already exists
 */
router.get('/media/check', async (req: Request, res: Response) => {
  try {
    const hash = req.query.hash as string;

    if (!hash) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'hash parameter is required'));
      return;
    }

    const mediaItem = await mediaItemService.findByHash(hash);

    res.json(successResponse({
      exists: !!mediaItem,
      mediaItem: mediaItem || null
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/works/:workId/media
 * Add a media item to a work
 */
router.post('/works/:workId/media', async (req: Request, res: Response) => {
  try {
    const workId = req.params.workId as string;
    const data: CreateMediaItemData = req.body;

    // Validate required fields
    if (!data.filePath || !data.originalFilename || !data.fileType || !data.mimeType) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 
        'filePath, originalFilename, fileType, and mimeType are required'));
      return;
    }

    const mediaItem = await mediaItemService.createMediaItem(workId, data);
    res.status(201).json(successResponse(mediaItem, 'Media item added successfully'));
  } catch (error: any) {
    if (error.message.includes('not found')) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, error.message));
      return;
    }
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/works/:workId/media
 * Get all media items for a work
 */
router.get('/works/:workId/media', async (req: Request, res: Response) => {
  try {
    const workId = req.params.workId as string;
    const mediaItems = await mediaItemService.getMediaItemsByWork(workId);
    res.json(successResponse(mediaItems));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * PUT /api/media/:id
 * Update a media item (position)
 */
router.put('/media/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: UpdateMediaItemData = req.body;

    const mediaItem = await mediaItemService.updateMediaItem(id, data);
    
    if (!mediaItem) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Media item not found'));
      return;
    }

    res.json(successResponse(mediaItem, 'Media item updated successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * DELETE /api/media/:id
 * Delete a media item
 */
router.delete('/media/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await mediaItemService.deleteMediaItem(id);

    if (!deleted) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Media item not found'));
      return;
    }

    res.json(successResponse(null, 'Media item deleted successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/works/:workId/media/reorder
 * Reorder media items within a work
 */
router.post('/works/:workId/media/reorder', async (req: Request, res: Response) => {
  try {
    const workId = req.params.workId as string;
    const { itemIds } = req.body;

    if (!Array.isArray(itemIds)) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'itemIds must be an array'));
      return;
    }

    await mediaItemService.reorderMediaItems(workId, itemIds);
    res.json(successResponse(null, 'Media items reordered successfully'));
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('must include')) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, error.message));
      return;
    }
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;