import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { shareService } from '../services/shareService.js';
import { workService } from '../services/workService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads/works');

const router = Router();

/**
 * GET /api/share/:token
 * Get works by share token (public access, no auth required)
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;

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
 * Per D-13: Download requires token validation
 * Per D-14: Verify workId is in share's workIds
 */
router.get('/:token/download/:workId', async (req: Request, res: Response) => {
  try {
    const { token, workId } = req.params;

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

    // Increment download count
    await workService.incrementDownloadCount(workId);

    // Stream original file (filePath, NOT watermarked)
    const filePath = path.join(UPLOAD_DIR, work.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '文件不存在'));
      return;
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(work.originalFilename)}"`);
    res.setHeader('Content-Type', work.mimeType);

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

export default router;