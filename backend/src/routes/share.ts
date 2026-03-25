import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { shareService } from '../services/shareService.js';
import { workService } from '../services/workService.js';
import { mediaItemService } from '../services/mediaItemService.js';
import { accessLogService } from '../services/accessLogService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads/works');

const router = Router();

/**
 * GET /api/share/:token
 * Get works by share token (public access, no auth required)
 * Returns works with all their media items
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;

    // Validate token
    const shareData = await shareService.validateToken(token);

    if (!shareData) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
      return;
    }

    // Fetch works by IDs
    const works = await Promise.all(
      shareData.workIds.map(workId => workService.getWorkById(workId))
    );

    // Filter out nulls (in case some works were deleted)
    const validWorks = works.filter(w => w !== null);

    // Record access for each viewed work (first work as representative)
    // This is called on initial page load to track "view" action
    if (validWorks.length > 0) {
      // Record view for the first work as page view indicator
      await accessLogService.recordAccess(token, validWorks[0].id, 'view', req);
    }

    res.json(successResponse({
      token,
      expiresAt: shareData.expiresAt,
      works: validWorks,
    }));
  } catch (error: any) {
    console.error('Error in GET /api/share/:token:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/share/:token/download/:workId
 * Download original file (no watermark) for authorized work
 * If work has multiple media items, downloads the first one
 * Per D-13: Download requires token validation
 * Per D-14: Verify workId is in share's workIds
 */
router.get('/:token/download/:workId', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const workId = req.params.workId as string;

    // Validate token
    const shareData = await shareService.validateToken(token);

    if (!shareData) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
      return;
    }

    // Check if workId is in share (per D-14)
    const isAuthorized = await shareService.isWorkInShare(token, workId);

    if (!isAuthorized) {
      res.status(403).json(errorResponse(ErrorCodes.FORBIDDEN, '无权下载此作品'));
      return;
    }

    // Fetch work
    const work = await workService.getWorkById(workId);

    if (!work) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '作品不存在'));
      return;
    }

    // Determine which file to download
    // If work has media items, download the first one; otherwise use legacy filePath
    let filePath: string;
    let originalFilename: string;
    let mimeType: string;

    if (work.mediaItems && work.mediaItems.length > 0) {
      // Use first media item
      const firstItem = work.mediaItems[0];
      filePath = path.join(UPLOAD_DIR, firstItem.filePath.replace('uploads/works/', ''));
      originalFilename = firstItem.originalFilename;
      mimeType = firstItem.mimeType;
    } else if (work.filePath) {
      // Fallback to legacy filePath
      filePath = path.join(UPLOAD_DIR, work.filePath.replace('uploads/works/', ''));
      originalFilename = work.originalFilename;
      mimeType = work.mimeType;
    } else {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '作品没有可下载的文件'));
      return;
    }

    // Increment download count in work model
    await workService.incrementDownloadCount(workId);

    // Record access log for download
    await accessLogService.recordAccess(token, workId, 'download', req);

    if (!fs.existsSync(filePath)) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '文件不存在'));
      return;
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFilename)}"`);
    res.setHeader('Content-Type', mimeType);

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, '文件下载失败'));
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/share/:token/download/:workId:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/share/:token/download/:workId/media/:mediaId
 * Download a specific media item from a work
 * Per D-13: Download requires token validation
 * Per D-14: Verify workId is in share's workIds
 */
router.get('/:token/download/:workId/media/:mediaId', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const workId = req.params.workId as string;
    const mediaId = req.params.mediaId as string;

    // Validate token
    const shareData = await shareService.validateToken(token);

    if (!shareData) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
      return;
    }

    // Check if workId is in share (per D-14)
    const isAuthorized = await shareService.isWorkInShare(token, workId);

    if (!isAuthorized) {
      res.status(403).json(errorResponse(ErrorCodes.FORBIDDEN, '无权下载此作品'));
      return;
    }

    // Fetch media item
    const mediaItem = await mediaItemService.getMediaItemById(mediaId);

    if (!mediaItem || mediaItem.workId !== workId) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '媒体项不存在'));
      return;
    }

    // Get file path
    const filePath = path.join(UPLOAD_DIR, mediaItem.filePath.replace('uploads/works/', ''));

    // Increment download count in work model
    await workService.incrementDownloadCount(workId);

    // Record access log for download
    await accessLogService.recordAccess(token, workId, 'download', req);

    if (!fs.existsSync(filePath)) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '文件不存在'));
      return;
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(mediaItem.originalFilename)}"`);
    res.setHeader('Content-Type', mediaItem.mimeType);

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, '文件下载失败'));
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/share/:token/download/:workId/media/:mediaId:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/share/:token/view/:workId
 * Record a view action for a specific work
 * Optional endpoint for more granular view tracking
 */
router.post('/:token/view/:workId', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const workId = req.params.workId as string;

    // Validate token
    const shareData = await shareService.validateToken(token);

    if (!shareData) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
      return;
    }

    // Check if workId is in share
    const isAuthorized = await shareService.isWorkInShare(token, workId);

    if (!isAuthorized) {
      res.status(403).json(errorResponse(ErrorCodes.FORBIDDEN, '无权查看此作品'));
      return;
    }

    // Record view access
    await accessLogService.recordAccess(token, workId, 'view', req);

    res.json(successResponse(null, '访问已记录'));
  } catch (error: any) {
    console.error('Error in POST /api/share/:token/view/:workId:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;