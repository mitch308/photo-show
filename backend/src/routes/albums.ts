import { Router, Request, Response } from 'express';
import { albumService, CreateAlbumData, UpdateAlbumData } from '../services/albumService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/albums
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const albums = await albumService.getAlbums();
    res.json(successResponse(albums));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/albums/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const album = await albumService.getAlbumById(id);
    if (!album) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Album not found'));
      return;
    }
    res.json(successResponse(album));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/albums
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateAlbumData = req.body;
    
    if (!data.name) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'Name is required'));
      return;
    }

    const album = await albumService.createAlbum(data);
    res.status(201).json(successResponse(album, 'Album created successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * PUT /api/albums/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: UpdateAlbumData = req.body;
    const album = await albumService.updateAlbum(id, data);
    
    if (!album) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Album not found'));
      return;
    }
    
    res.json(successResponse(album, 'Album updated successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * DELETE /api/albums/:id
 * Query param: deleteWorks=true to delete all works in album
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleteWorks = req.query.deleteWorks === 'true';
    const deleted = await albumService.deleteAlbum(id, deleteWorks);
    
    if (!deleted) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, 'Album not found'));
      return;
    }
    
    res.json(successResponse(null, 'Album deleted successfully'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * PUT /api/albums/positions
 */
router.put('/positions', async (req: Request, res: Response) => {
  try {
    const { positions } = req.body;
    await albumService.setAlbumsPosition(positions);
    res.json(successResponse(null, 'Positions updated'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;