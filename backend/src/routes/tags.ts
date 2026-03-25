import { Router, Request, Response } from 'express';
import { tagService, CreateTagData } from '../services/tagService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/tags
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const tags = q 
      ? await tagService.searchTags(q as string)
      : await tagService.getTags();
    res.json(successResponse(tags));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/tags/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tag = await tagService.getTagById(id);
    if (!tag) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Tag not found'));
      return;
    }
    res.json(successResponse(tag));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/tags
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateTagData = req.body;
    
    if (!data.name) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'Name is required'));
      return;
    }

    const tag = await tagService.createTag(data);
    res.status(201).json(successResponse(tag, 'Tag created successfully'));
  } catch (error: any) {
    if (error.message === 'Tag already exists') {
      res.status(409).json(errorResponse(ErrorCodes.VALIDATION_ERROR, error.message));
      return;
    }
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * PUT /api/tags/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name } = req.body;
    const tag = await tagService.updateTag(id, name);
    
    if (!tag) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Tag not found'));
      return;
    }
    
    res.json(successResponse(tag, 'Tag updated successfully'));
  } catch (error: any) {
    if (error.message === 'Tag name already exists') {
      res.status(409).json(errorResponse(ErrorCodes.VALIDATION_ERROR, error.message));
      return;
    }
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * DELETE /api/tags/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await tagService.deleteTag(id);
    
    if (!deleted) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Tag not found'));
      return;
    }
    
    res.json(successResponse(null, 'Tag deleted successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;