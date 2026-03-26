import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { shareService } from '../services/shareService.js';
import { albumService } from '../services/albumService.js';
import { workService } from '../services/workService.js';
import { mediaItemService } from '../services/mediaItemService.js';
import { accessLogService } from '../services/accessLogService.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads/works');

const router = Router();

/**
 * GET /api/album-share/:token
 * Get album by share token (public access)
 * Per SHAR-02: 相册分享功能
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const shareData = await shareService.validateToken(token);

    if (!shareData || !shareData.albumId) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
    }

    const album = await albumService.getAlbumById(shareData.albumId);
    if (!album) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '相册不存在'));
    }

    // Increment access count
    await shareService.incrementAccessCount(token);

    // Record access
    await accessLogService.recordAccess(token, album.id, 'view', req);

    res.json(successResponse({
      token,
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        coverPath: album.coverPath,
      },
      works: album.works || [],
      expiresAt: shareData.expiresAt,
    }));
  } catch (error: any) {
    console.error('Error in GET /api/album-share/:token:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/album-share/:token/download/:workId
 * Download work from album share
 * Per SHAR-03: 客户可通过链接下载原图
 */
router.get('/:token/download/:workId', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const workId = req.params.workId as string;

    const shareData = await shareService.validateToken(token);
    if (!shareData || !shareData.albumId) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
    }

    const album = await albumService.getAlbumById(shareData.albumId);
    if (!album) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '相册不存在'));
    }

    // Check if work is in the album
    const workInAlbum = album.works?.some(w => w.id === workId);
    if (!workInAlbum) {
      return res.status(403).json(errorResponse(ErrorCodes.FORBIDDEN, '无权下载此作品'));
    }

    const work = await workService.getWorkById(workId);
    if (!work) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '作品不存在'));
    }

    let filePath: string;
    let originalFilename: string;
    let mimeType: string;

    if (work.mediaItems && work.mediaItems.length > 0) {
      const firstItem = work.mediaItems[0];
      filePath = path.join(UPLOAD_DIR, firstItem.filePath.replace('uploads/works/', ''));
      originalFilename = firstItem.originalFilename;
      mimeType = firstItem.mimeType;
    } else if (work.filePath) {
      filePath = path.join(UPLOAD_DIR, work.filePath.replace('uploads/works/', ''));
      originalFilename = work.originalFilename;
      mimeType = work.mimeType;
    } else {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '作品没有可下载的文件'));
    }

    await workService.incrementDownloadCount(workId);
    await accessLogService.recordAccess(token, workId, 'download', req);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '文件不存在'));
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFilename)}"`);
    res.setHeader('Content-Type', mimeType);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, '文件下载失败'));
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/album-share/:token/download/:workId:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * GET /api/album-share/:token/download/:workId/media/:mediaId
 * Download specific media item from work in album share
 */
router.get('/:token/download/:workId/media/:mediaId', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const workId = req.params.workId as string;
    const mediaId = req.params.mediaId as string;

    const shareData = await shareService.validateToken(token);
    if (!shareData || !shareData.albumId) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
    }

    const album = await albumService.getAlbumById(shareData.albumId);
    if (!album) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '相册不存在'));
    }

    // Check if work is in the album
    const workInAlbum = album.works?.some(w => w.id === workId);
    if (!workInAlbum) {
      return res.status(403).json(errorResponse(ErrorCodes.FORBIDDEN, '无权下载此作品'));
    }

    const mediaItem = await mediaItemService.getMediaItemById(mediaId);
    if (!mediaItem || mediaItem.workId !== workId) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '媒体项不存在'));
    }

    const filePath = path.join(UPLOAD_DIR, mediaItem.filePath.replace('uploads/works/', ''));

    await workService.incrementDownloadCount(workId);
    await accessLogService.recordAccess(token, workId, 'download', req);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '文件不存在'));
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(mediaItem.originalFilename)}"`);
    res.setHeader('Content-Type', mediaItem.mimeType);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, '文件下载失败'));
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/album-share/:token/download/:workId/media/:mediaId:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;