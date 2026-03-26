import { Router, Request, Response } from 'express';
import { workService, CreateWorkData, UpdateWorkData, MediaItemInput } from '../services/workService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/works
 * List all works with optional filters
 * Returns works with their media items
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { albumId, tagId, isPublic, title, isPinned } = req.query;
    const works = await workService.getWorks({
      albumId: albumId as string | undefined,
      tagId: tagId as string | undefined,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      title: title as string | undefined,
      isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
    });
    res.json(successResponse(works));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/works/:id
 * Get a single work with media items
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const work = await workService.getWorkById(id);
    if (!work) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Work not found'));
      return;
    }
    res.json(successResponse(work));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/works
 * Create a new work
 * Supports both legacy single-file format and new multi-media format
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateWorkData = req.body;
    
    // Validate required fields
    if (!data.title) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'Title is required'));
      return;
    }

    // Check if using new mediaItems format or legacy format
    if (!data.mediaItems || data.mediaItems.length === 0) {
      // Legacy format: require filePath
      if (!data.filePath) {
        res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 
          'Either mediaItems or filePath is required'));
        return;
      }
    }

    const work = await workService.createWork(data);
    res.status(201).json(successResponse(work, 'Work created successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * PUT /api/works/:id
 * Update work metadata (not media items - use media items API for that)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: UpdateWorkData = req.body;
    const work = await workService.updateWork(id, data);
    
    if (!work) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Work not found'));
      return;
    }
    
    res.json(successResponse(work, 'Work updated successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * DELETE /api/works/:id
 * Delete a work and all its media items
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await workService.deleteWork(id);
    
    if (!deleted) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Work not found'));
      return;
    }
    
    res.json(successResponse(null, 'Work deleted successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * PUT /api/works/positions
 * Update positions for drag-and-drop sorting
 */
router.put('/positions', async (req: Request, res: Response) => {
  try {
    const { positions } = req.body; // Array of { id, position }
    
    if (!Array.isArray(positions)) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'positions must be an array'));
      return;
    }

    await workService.setWorksPosition(positions);
    res.json(successResponse(null, 'Positions updated'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;