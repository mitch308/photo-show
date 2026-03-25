import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock shareService
const mockShareService = vi.hoisted(() => ({
  createShareToken: vi.fn(),
  listAllShares: vi.fn(),
  getShareInfo: vi.fn(),
  revokeToken: vi.fn(),
}));

// Mock authMiddleware
const mockAuthMiddleware = vi.hoisted(() => (req: any, res: any, next: any) => {
  req.user = { id: 'admin-1', username: 'admin', type: 'access' };
  next();
});

vi.mock('../../services/shareService.js', () => ({
  shareService: mockShareService,
}));

vi.mock('../../middlewares/auth.js', () => ({
  authMiddleware: mockAuthMiddleware,
}));

// Import after mocks
import adminShareRoutes from './share.js';

describe('Admin Share Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/admin/share', adminShareRoutes);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/admin/share', () => {
    it('should create token with workIds', async () => {
      mockShareService.createShareToken.mockResolvedValue('generated-token-123');
      mockShareService.getShareInfo.mockResolvedValue({
        token: 'generated-token-123',
        workIds: ['work-1', 'work-2'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      });

      const response = await request(app)
        .post('/api/admin/share')
        .send({ workIds: ['work-1', 'work-2'] });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(0);
      expect(response.body.data.token).toBe('generated-token-123');
      expect(response.body.data.shareUrl).toContain('/share/generated-token-123');
      expect(mockShareService.createShareToken).toHaveBeenCalledWith(
        ['work-1', 'work-2'],
        { expiresInDays: 7, maxAccess: undefined, clientId: undefined }
      );
    });

    it('should accept expiresInDays parameter', async () => {
      mockShareService.createShareToken.mockResolvedValue('generated-token-456');
      mockShareService.getShareInfo.mockResolvedValue({
        token: 'generated-token-456',
        workIds: ['work-1'],
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      });

      const response = await request(app)
        .post('/api/admin/share')
        .send({ workIds: ['work-1'], expiresInDays: 30 });

      expect(response.status).toBe(201);
      expect(mockShareService.createShareToken).toHaveBeenCalledWith(
        ['work-1'],
        { expiresInDays: 30, maxAccess: undefined, clientId: undefined }
      );
    });

    it('should accept maxAccess and clientId parameters', async () => {
      mockShareService.createShareToken.mockResolvedValue('generated-token-789');
      mockShareService.getShareInfo.mockResolvedValue({
        token: 'generated-token-789',
        workIds: ['work-1'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        maxAccess: 10,
        clientId: 'client-1',
      });

      const response = await request(app)
        .post('/api/admin/share')
        .send({ workIds: ['work-1'], maxAccess: 10, clientId: 'client-1' });

      expect(response.status).toBe(201);
      expect(mockShareService.createShareToken).toHaveBeenCalledWith(
        ['work-1'],
        { expiresInDays: 7, maxAccess: 10, clientId: 'client-1' }
      );
    });

    it('should validate workIds is non-empty array', async () => {
      const response = await request(app)
        .post('/api/admin/share')
        .send({ workIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('workIds');
    });

    it('should validate workIds is required', async () => {
      const response = await request(app)
        .post('/api/admin/share')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('workIds');
    });
  });

  describe('GET /api/admin/share', () => {
    it('should list all active shares', async () => {
      const mockShares = [
        { token: 'token-1', workIds: ['work-1'], expiresAt: Date.now() + 60000, createdAt: Date.now() },
        { token: 'token-2', workIds: ['work-2'], expiresAt: Date.now() + 60000, createdAt: Date.now() },
      ];

      mockShareService.listAllShares.mockResolvedValue(mockShares);

      const response = await request(app).get('/api/admin/share');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/admin/share/:token', () => {
    it('should get single share details', async () => {
      const mockShareInfo = {
        token: 'my-token',
        workIds: ['work-1', 'work-2'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      mockShareService.getShareInfo.mockResolvedValue(mockShareInfo);

      const response = await request(app).get('/api/admin/share/my-token');

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBe('my-token');
      expect(mockShareService.getShareInfo).toHaveBeenCalledWith('my-token');
    });

    it('should return 404 for nonexistent token', async () => {
      mockShareService.getShareInfo.mockResolvedValue(null);

      const response = await request(app).get('/api/admin/share/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/share/:token', () => {
    it('should revoke token', async () => {
      mockShareService.revokeToken.mockResolvedValue(true);

      const response = await request(app).delete('/api/admin/share/token-to-revoke');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('撤销');
      expect(mockShareService.revokeToken).toHaveBeenCalledWith('token-to-revoke');
    });

    it('should return 404 for nonexistent token', async () => {
      mockShareService.revokeToken.mockResolvedValue(false);

      const response = await request(app).delete('/api/admin/share/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});