import { Router, Request, Response } from 'express';
import { shareService } from '../../services/shareService.js';
import { successResponse, errorResponse, ErrorCodes } from '../../types/response.js';
import { authMiddleware } from '../../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/admin/share
 * Create a new share link
 * 
 * Body: { workIds: string[], expiresInDays?: number }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { workIds, expiresInDays } = req.body;

    // Validate workIds
    if (!workIds || !Array.isArray(workIds) || workIds.length === 0) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'workIds 必须是非空数组'));
      return;
    }

    // Validate expiresInDays if provided
    if (expiresInDays !== undefined) {
      if (typeof expiresInDays !== 'number' || expiresInDays <= 0) {
        res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'expiresInDays 必须是正整数'));
        return;
      }
    }

    // Create share token
    const token = await shareService.createShareToken(workIds, expiresInDays || 7);

    // Get the share info to return
    const shareInfo = await shareService.getShareInfo(token);

    // Construct share URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareUrl = `${frontendUrl}/share/${token}`;

    res.status(201).json(successResponse({
      token,
      shareUrl,
      expiresAt: shareInfo?.expiresAt,
      workIds,
    }, '分享链接创建成功'));
  } catch (error: any) {
    console.error('Error in POST /api/admin/share:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/admin/share
 * List all active share links
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const shares = await shareService.listAllShares();
    res.json(successResponse(shares));
  } catch (error: any) {
    console.error('Error in GET /api/admin/share:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/admin/share/:token
 * Get single share details
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const shareInfo = await shareService.getShareInfo(token);

    if (!shareInfo) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '分享链接不存在'));
      return;
    }

    res.json(successResponse(shareInfo));
  } catch (error: any) {
    console.error('Error in GET /api/admin/share/:token:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * DELETE /api/admin/share/:token
 * Revoke a share link
 */
router.delete('/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const revoked = await shareService.revokeToken(token);

    if (!revoked) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '分享链接不存在'));
      return;
    }

    res.json(successResponse(null, '分享链接已撤销'));
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/share/:token:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;