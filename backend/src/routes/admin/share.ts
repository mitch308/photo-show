import { Router, Request, Response } from 'express';
import { shareService } from '../../services/shareService.js';
import { albumService } from '../../services/albumService.js';
import { AppDataSource } from '../../config/database.js';
import { ShareAccessLog } from '../../models/ShareAccessLog.js';
import { successResponse, errorResponse, ErrorCodes } from '../../types/response.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { Repository } from 'typeorm';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/admin/share
 * Create a new share link
 * Per PRIV-06: 支持访问次数限制
 * Per CLNT-02: 支持为客户创建专属私密链接
 * 
 * Body: { 
 *   workIds: string[], 
 *   expiresInDays?: number,
 *   maxAccess?: number,
 *   clientId?: string
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { workIds, expiresInDays, maxAccess, clientId } = req.body;

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

    // Validate maxAccess if provided
    if (maxAccess !== undefined) {
      if (typeof maxAccess !== 'number' || maxAccess <= 0) {
        res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'maxAccess 必须是正整数'));
        return;
      }
    }

    // Validate clientId if provided
    if (clientId !== undefined && typeof clientId !== 'string') {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'clientId 必须是字符串'));
      return;
    }

    // Create share token with enhanced options
    const token = await shareService.createShareToken(workIds, {
      expiresInDays: expiresInDays || 7,
      maxAccess,
      clientId,
    });

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
      maxAccess: shareInfo?.maxAccess,
      clientId: shareInfo?.clientId,
    }, '分享链接创建成功'));
  } catch (error: any) {
    console.error('Error in POST /api/admin/share:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/admin/share/album
 * Create a share link for an album
 * Per SHAR-02: 相册分享功能
 * 
 * Body: { 
 *   albumId: string,
 *   expiresInDays?: number,
 *   maxAccess?: number,
 *   clientId?: string
 * }
 */
router.post('/album', async (req: Request, res: Response) => {
  try {
    const { albumId, expiresInDays, maxAccess, clientId } = req.body;

    if (!albumId || typeof albumId !== 'string') {
      return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'albumId 必须是非空字符串'));
    }

    const album = await albumService.getAlbumById(albumId);
    if (!album) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '相册不存在'));
    }

    // Validate expiresInDays if provided
    if (expiresInDays !== undefined) {
      if (typeof expiresInDays !== 'number' || expiresInDays <= 0) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'expiresInDays 必须是正整数'));
      }
    }

    // Validate maxAccess if provided
    if (maxAccess !== undefined) {
      if (typeof maxAccess !== 'number' || maxAccess <= 0) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'maxAccess 必须是正整数'));
      }
    }

    const token = await shareService.createAlbumShareToken(albumId, album.name, {
      expiresInDays: expiresInDays || 7,
      maxAccess,
      clientId,
    });

    const shareInfo = await shareService.getShareInfo(token);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareUrl = `${frontendUrl}/album-share/${token}`;

    res.status(201).json(successResponse({
      token,
      shareUrl,
      albumId,
      albumName: album.name,
      expiresAt: shareInfo?.expiresAt,
      maxAccess: shareInfo?.maxAccess,
      clientId: shareInfo?.clientId,
      workCount: album.works?.length || 0,
    }, '相册分享链接创建成功'));
  } catch (error: any) {
    console.error('Error in POST /api/admin/share/album:', error);
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
 * PUT /api/admin/share/:token
 * Update share settings (maxAccess, clientId)
 * Per PRIV-06: 修改访问次数限制
 */
router.put('/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { maxAccess, clientId } = req.body;

    // Validate maxAccess if provided
    if (maxAccess !== undefined && maxAccess !== null) {
      if (typeof maxAccess !== 'number' || maxAccess <= 0) {
        res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'maxAccess 必须是正整数'));
        return;
      }
    }

    // Validate clientId if provided
    if (clientId !== undefined && clientId !== null && typeof clientId !== 'string') {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'clientId 必须是字符串'));
      return;
    }

    const shareInfo = await shareService.updateShareToken(token, {
      maxAccess: maxAccess ?? undefined,
      clientId: clientId ?? undefined,
    });

    if (!shareInfo) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '分享链接不存在'));
      return;
    }

    res.json(successResponse(shareInfo, '分享链接更新成功'));
  } catch (error: any) {
    console.error('Error in PUT /api/admin/share/:token:', error);
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

/**
 * GET /api/admin/share/:token/access-logs
 * Get access logs for a share
 * Per PRIV-05: 管理员可以查看私密链接的访问记录
 */
router.get('/:token/access-logs', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { limit, offset } = req.query;

    // Verify share exists
    const shareInfo = await shareService.getShareInfo(token);
    if (!shareInfo) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '分享链接不存在'));
      return;
    }

    // Query access logs
    const accessLogRepo: Repository<ShareAccessLog> = AppDataSource.getRepository(ShareAccessLog);
    const queryBuilder = accessLogRepo.createQueryBuilder('log')
      .where('log.token = :token', { token })
      .orderBy('log.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    const parsedLimit = limit ? parseInt(limit as string, 10) : 50;
    const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

    queryBuilder.take(parsedLimit).skip(parsedOffset);

    const logs = await queryBuilder.getMany();

    res.json(successResponse({
      logs,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
    }));
  } catch (error: any) {
    console.error('Error in GET /api/admin/share/:token/access-logs:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;