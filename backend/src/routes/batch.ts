import { Router, Request, Response } from 'express';
import { batchService } from '../services/batchService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/batch/works/status
 * Batch update isPublic status for works
 * Per BATCH-02: 管理员可以批量修改作品的公开状态
 * 
 * Body: { workIds: string[], isPublic: boolean }
 */
router.post('/works/status', async (req: Request, res: Response) => {
  try {
    const { workIds, isPublic } = req.body;

    // Validate workIds
    if (!workIds || !Array.isArray(workIds) || workIds.length === 0) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'workIds 必须是非空数组'));
      return;
    }

    // Validate isPublic
    if (typeof isPublic !== 'boolean') {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'isPublic 必须是布尔值'));
      return;
    }

    const result = await batchService.batchUpdateStatus(workIds, isPublic);

    res.json(successResponse(result, `成功更新 ${result.success.length} 个作品状态`));
  } catch (error: any) {
    console.error('Error in POST /api/batch/works/status:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/batch/works/move
 * Batch move works to albums
 * Per BATCH-03: 管理员可以批量移动作品到相册
 * 
 * Body: { workIds: string[], albumIds: string[], mode?: 'add' | 'set' | 'remove' }
 */
router.post('/works/move', async (req: Request, res: Response) => {
  try {
    const { workIds, albumIds, mode = 'set' } = req.body;

    // Validate workIds
    if (!workIds || !Array.isArray(workIds) || workIds.length === 0) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'workIds 必须是非空数组'));
      return;
    }

    // Validate albumIds
    if (!albumIds || !Array.isArray(albumIds)) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'albumIds 必须是数组'));
      return;
    }

    // Validate mode
    const validModes = ['add', 'set', 'remove'];
    if (!validModes.includes(mode)) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, `mode 必须是 ${validModes.join(', ')} 之一`));
      return;
    }

    const result = await batchService.batchMoveWorks(workIds, albumIds, mode);

    res.json(successResponse(result, `成功移动 ${result.success.length} 个作品`));
  } catch (error: any) {
    console.error('Error in POST /api/batch/works/move:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/batch/works/delete
 * Batch delete works
 * Per BATCH-04: 管理员可以批量删除作品
 * 
 * Body: { workIds: string[] }
 */
router.post('/works/delete', async (req: Request, res: Response) => {
  try {
    const { workIds } = req.body;

    // Validate workIds
    if (!workIds || !Array.isArray(workIds) || workIds.length === 0) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'workIds 必须是非空数组'));
      return;
    }

    const result = await batchService.batchDeleteWorks(workIds);

    res.json(successResponse(result, `成功删除 ${result.success.length} 个作品`));
  } catch (error: any) {
    console.error('Error in POST /api/batch/works/delete:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;