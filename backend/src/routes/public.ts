import { Router, Request, Response } from 'express';
import { publicService } from '../services/publicService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';

const router = Router();

/**
 * GET /api/public/works
 * List public works with optional filters and search
 * No authentication required
 */
router.get('/works', async (req: Request, res: Response) => {
  try {
    const { albumId, tagId, q, limit, offset } = req.query;

    const options = {
      albumId: albumId as string | undefined,
      tagId: tagId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    let result;

    // Use search if q parameter is provided
    if (q && typeof q === 'string' && q.trim()) {
      result = await publicService.searchPublicWorks(q.trim(), {
        limit: options.limit,
        offset: options.offset,
      });
    } else {
      result = await publicService.getPublicWorks(options);
    }

    res.json(successResponse(result));
  } catch (error: any) {
    console.error('Error in GET /api/public/works:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/public/works/:id
 * Get a single public work
 * No authentication required
 */
router.get('/works/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const work = await publicService.getPublicWorkById(id);

    if (!work) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Work not found'));
      return;
    }

    res.json(successResponse(work));
  } catch (error: any) {
    console.error('Error in GET /api/public/works/:id:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/public/albums
 * List all albums with work count
 * No authentication required
 */
router.get('/albums', async (req: Request, res: Response) => {
  try {
    const albums = await publicService.getPublicAlbums();
    res.json(successResponse(albums));
  } catch (error: any) {
    console.error('Error in GET /api/public/albums:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/public/albums/:id
 * Get a single public album with works containing media items
 * No authentication required
 */
router.get('/albums/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const album = await publicService.getPublicAlbumById(id);

    if (!album) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Album not found'));
      return;
    }

    res.json(successResponse(album));
  } catch (error: any) {
    console.error('Error in GET /api/public/albums/:id:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/public/tags
 * List all tags with public work count
 * No authentication required
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await publicService.getPublicTags();
    res.json(successResponse(tags));
  } catch (error: any) {
    console.error('Error in GET /api/public/tags:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;