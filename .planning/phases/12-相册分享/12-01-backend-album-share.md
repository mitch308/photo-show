# 计划 12-01: 后端相册分享 API

## 目标

扩展后端分享系统支持相册分享功能。

## 实现步骤

### Step 1: 扩展 ShareTokenData 接口

**文件**: `backend/src/services/shareService.ts`

修改 `ShareTokenData` 接口：

```typescript
export interface ShareTokenData {
  workIds?: string[];      // 作品分享（可选，与 albumId 互斥）
  albumId?: string;        // 相册分享（可选，与 workIds 互斥）
  albumName?: string;      // 相册名称（用于管理端显示）
  expiresAt: number;
  createdAt: number;
  createdBy?: string;
  clientId?: string;
  maxAccess?: number;
  accessCount?: number;
}
```

**约束**: `workIds` 和 `albumId` 互斥，只能设置其中一个。

### Step 2: 添加相册分享创建方法

**文件**: `backend/src/services/shareService.ts`

在 `ShareService` 类中添加：

```typescript
/**
 * Create a share token for an album
 * @param albumId - Album ID to share
 * @param albumName - Album name for display
 * @param options - Optional settings
 */
async createAlbumShareToken(
  albumId: string,
  albumName: string,
  options?: {
    expiresInDays?: number;
    clientId?: string;
    maxAccess?: number;
  }
): Promise<string> {
  const token = this.generateToken();
  const now = Date.now();
  const expiresInDays = options?.expiresInDays ?? 7;
  const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;
  const ttlSeconds = expiresInDays * 24 * 60 * 60;

  const data: ShareTokenData = {
    albumId,
    albumName,
    expiresAt,
    createdAt: now,
    clientId: options?.clientId,
    maxAccess: options?.maxAccess,
    accessCount: 0,
  };

  const redis = getRedis();
  const key = `${this.KEY_PREFIX}${token}`;
  await redis.setex(key, ttlSeconds, JSON.stringify(data));

  return token;
}

/**
 * Check if share is an album share
 */
isAlbumShare(data: ShareTokenData): boolean {
  return !!data.albumId;
}
```

### Step 3: 创建公开相册分享路由

**文件**: `backend/src/routes/albumShare.ts` (新建)

```typescript
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
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const shareData = await shareService.validateToken(token);

    if (!shareData || !shareData.albumId) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
    }

    const album = await albumService.getAlbumById(shareData.albumId);
    if (!album) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '相册不存在'));
    }

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
 */
router.get('/:token/download/:workId', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const workId = req.params.workId;

    const shareData = await shareService.validateToken(token);
    if (!shareData || !shareData.albumId) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
    }

    const album = await albumService.getAlbumById(shareData.albumId);
    if (!album) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '相册不存在'));
    }

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
    const token = req.params.token;
    const workId = req.params.workId;
    const mediaId = req.params.mediaId;

    const shareData = await shareService.validateToken(token);
    if (!shareData || !shareData.albumId) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '链接已过期或不存在'));
    }

    const album = await albumService.getAlbumById(shareData.albumId);
    if (!album) {
      return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '相册不存在'));
    }

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
```

### Step 4: 扩展管理端分享 API

**文件**: `backend/src/routes/admin/share.ts`

添加 import 和相册分享创建端点：

```typescript
import { albumService } from '../../services/albumService.js';

// ... existing code ...

/**
 * POST /api/admin/share/album
 * Create a share link for an album
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
    }, '相册分享链接创建成功'));
  } catch (error: any) {
    console.error('Error in POST /api/admin/share/album:', error);
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});
```

### Step 5: 注册路由

**文件**: `backend/src/app.ts`

添加相册分享路由：

```typescript
import albumShareRoutes from './routes/albumShare.js';
// ...
app.use('/api/album-share', albumShareRoutes);
```

## 验证要点

1. 创建相册分享链接返回正确 token 和 URL
2. GET `/api/album-share/:token` 返回相册信息和作品列表
3. 下载接口正确验证权限
4. 访问记录正确记录
5. 过期和访问限制正确生效