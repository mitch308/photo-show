import { Router, Request, Response } from 'express';
import { statsService } from '../services/statsService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/stats/works
 * Get work statistics
 * Per STAT-01~02: 作品浏览下载统计
 * 
 * Query params:
 * - sortBy: 'viewCount' | 'downloadCount' | 'createdAt' (default: viewCount)
 * - sortOrder: 'ASC' | 'DESC' (default: DESC)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
router.get('/works', async (req: Request, res: Response) => {
  try {
    const { sortBy, sortOrder, limit, offset } = req.query;

    const validSortBy = ['viewCount', 'downloadCount', 'createdAt'];
    const validSortOrder = ['ASC', 'DESC'];

    const options = {
      sortBy: validSortBy.includes(sortBy as string) ? sortBy as 'viewCount' | 'downloadCount' | 'createdAt' : undefined,
      sortOrder: validSortOrder.includes((sortOrder as string)?.toUpperCase()) ? (sortOrder as string).toUpperCase() as 'ASC' | 'DESC' : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    };

    const result = await statsService.getWorkStats(options);
    res.json(successResponse(result));
  } catch (error: any) {
    console.error('Error in GET /api/stats/works:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/stats/albums
 * Get album statistics
 * Per STAT-03: 相册浏览统计
 * 
 * Query params:
 * - sortBy: 'name' | 'workCount' | 'totalViews' | 'totalDownloads' (default: totalViews)
 * - sortOrder: 'ASC' | 'DESC' (default: DESC)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
router.get('/albums', async (req: Request, res: Response) => {
  try {
    const { sortBy, sortOrder, limit, offset } = req.query;

    const validSortBy = ['name', 'workCount', 'totalViews', 'totalDownloads'];
    const validSortOrder = ['ASC', 'DESC'];

    const options = {
      sortBy: validSortBy.includes(sortBy as string) ? sortBy as 'name' | 'workCount' | 'totalViews' | 'totalDownloads' : undefined,
      sortOrder: validSortOrder.includes((sortOrder as string)?.toUpperCase()) ? (sortOrder as string).toUpperCase() as 'ASC' | 'DESC' : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    };

    const result = await statsService.getAlbumStats(options);
    res.json(successResponse(result));
  } catch (error: any) {
    console.error('Error in GET /api/stats/albums:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/stats/overview
 * Get overview statistics
 * Per STAT-04: 总览数据
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const result = await statsService.getOverviewStats();
    res.json(successResponse(result));
  } catch (error: any) {
    console.error('Error in GET /api/stats/overview:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;