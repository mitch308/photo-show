import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock shareService
const mockShareService = vi.hoisted(() => ({
  validateToken: vi.fn(),
  isWorkInShare: vi.fn(),
}));

// Mock workService
const mockWorkService = vi.hoisted(() => ({
  getWorkById: vi.fn(),
  incrementDownloadCount: vi.fn(),
}));

// Mock accessLogService
const mockAccessLogService = vi.hoisted(() => ({
  recordAccess: vi.fn(),
}));

vi.mock('../services/shareService.js', () => ({
  shareService: mockShareService,
}));

vi.mock('../services/workService.js', () => ({
  workService: mockWorkService,
}));

vi.mock('../services/accessLogService.js', () => ({
  accessLogService: mockAccessLogService,
}));

// Import after mocks
import shareRoutes from './share.js';

describe('Share Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/share', shareRoutes);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/share/:token', () => {
    it('should return works for valid token', async () => {
      const mockShareData = {
        workIds: ['work-1', 'work-2'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      const mockWorks = [
        { id: 'work-1', title: 'Work 1', filePath: '/path/1.jpg' },
        { id: 'work-2', title: 'Work 2', filePath: '/path/2.jpg' },
      ];

      mockShareService.validateToken.mockResolvedValue(mockShareData);
      mockWorkService.getWorkById
        .mockResolvedValueOnce(mockWorks[0])
        .mockResolvedValueOnce(mockWorks[1]);
      mockAccessLogService.recordAccess.mockResolvedValue({});

      const response = await request(app).get('/api/share/valid-token');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.token).toBe('valid-token');
      expect(response.body.data.expiresAt).toBeDefined();
      expect(response.body.data.works).toHaveLength(2);
    });

    it('should return 404 for expired token', async () => {
      mockShareService.validateToken.mockResolvedValue(null);

      const response = await request(app).get('/api/share/expired-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('链接已过期或不存在');
    });
  });

  describe('GET /api/share/:token/download/:workId', () => {
    it('should return file stream for authorized workId', async () => {
      const mockShareData = {
        workIds: ['work-1'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      const mockWork = {
        id: 'work-1',
        title: 'Test Work',
        filePath: '2026-03/test.jpg',
        originalFilename: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        fileType: 'image',
      };

      mockShareService.validateToken.mockResolvedValue(mockShareData);
      mockShareService.isWorkInShare.mockResolvedValue(true);
      mockWorkService.getWorkById.mockResolvedValue(mockWork);
      mockWorkService.incrementDownloadCount.mockResolvedValue(undefined);
      mockAccessLogService.recordAccess.mockResolvedValue({});

      const response = await request(app).get('/api/share/valid-token/download/work-1');

      expect(mockShareService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(mockShareService.isWorkInShare).toHaveBeenCalledWith('valid-token', 'work-1');
      expect(mockWorkService.incrementDownloadCount).toHaveBeenCalledWith('work-1');
      // Note: actual file streaming is tested in integration
    });

    it('should return 403 for unauthorized workId', async () => {
      const mockShareData = {
        workIds: ['work-1'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      mockShareService.validateToken.mockResolvedValue(mockShareData);
      mockShareService.isWorkInShare.mockResolvedValue(false);

      const response = await request(app).get('/api/share/valid-token/download/work-999');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('无权下载此作品');
    });

    it('should return 404 for expired token on download', async () => {
      mockShareService.validateToken.mockResolvedValue(null);

      const response = await request(app).get('/api/share/expired-token/download/work-1');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('链接已过期或不存在');
    });

    it('should return 404 when work not found', async () => {
      const mockShareData = {
        workIds: ['work-1'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      mockShareService.validateToken.mockResolvedValue(mockShareData);
      mockShareService.isWorkInShare.mockResolvedValue(true);
      mockWorkService.getWorkById.mockResolvedValue(null);

      const response = await request(app).get('/api/share/valid-token/download/work-1');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('作品不存在');
    });
  });
});