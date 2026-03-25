import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to create mocks before they're referenced in vi.mock
const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  scan: vi.fn(),
}));

// Mock the getRedis function before importing the service
vi.mock('../config/redis.js', () => ({
  getRedis: () => mockRedis,
}));

// Import after mock is set up
import { ShareService, ShareTokenData } from './shareService.js';

describe('ShareService', () => {
  let shareService: ShareService;

  beforeEach(() => {
    vi.clearAllMocks();
    shareService = new ShareService();
  });

  describe('generateToken', () => {
    it('should return a 43-char base64url string', () => {
      const token = shareService.generateToken();

      // 32 bytes in base64url = 43 characters (no padding)
      expect(token).toHaveLength(43);

      // Should only contain base64url characters (A-Z, a-z, 0-9, -, _)
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(shareService.generateToken());
      }
      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('createShareToken', () => {
    it('should store in Redis with correct TTL', async () => {
      const workIds = ['work-1', 'work-2', 'work-3'];
      const expiresInDays = 7;

      mockRedis.setex.mockResolvedValue('OK');

      const token = await shareService.createShareToken(workIds, { expiresInDays });

      // Verify token was generated
      expect(token).toHaveLength(43);

      // Verify setex was called with correct parameters
      expect(mockRedis.setex).toHaveBeenCalled();

      // Check the key format is share:{token}
      const setexCall = mockRedis.setex.mock.calls[0];
      expect(setexCall[0]).toMatch(/^share:/);

      // Check TTL is 7 days in seconds
      expect(setexCall[1]).toBe(7 * 24 * 60 * 60); // 604800 seconds

      // Check the data contains workIds
      const data = JSON.parse(setexCall[2]);
      expect(data.workIds).toEqual(workIds);
      expect(data.createdAt).toBeDefined();
      expect(data.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should use default expiration of 7 days if not specified', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      await shareService.createShareToken(['work-1']);

      const setexCall = mockRedis.setex.mock.calls[0];
      expect(setexCall[1]).toBe(7 * 24 * 60 * 60);
    });

    it('should calculate correct TTL for custom expiration', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      await shareService.createShareToken(['work-1'], { expiresInDays: 30 }); // 30 days

      const setexCall = mockRedis.setex.mock.calls[0];
      expect(setexCall[1]).toBe(30 * 24 * 60 * 60); // 2592000 seconds
    });
  });

  describe('validateToken', () => {
    it('should return workIds for valid token', async () => {
      const mockData: ShareTokenData = {
        workIds: ['work-1', 'work-2'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await shareService.validateToken('valid-token');

      expect(mockRedis.get).toHaveBeenCalledWith('share:valid-token');
      expect(result).not.toBeNull();
      expect(result?.workIds).toEqual(['work-1', 'work-2']);
    });

    it('should return null for expired/invalid token', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await shareService.validateToken('invalid-token');

      expect(mockRedis.get).toHaveBeenCalledWith('share:invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('revokeToken', () => {
    it('should remove token from Redis', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await shareService.revokeToken('token-to-revoke');

      expect(mockRedis.del).toHaveBeenCalledWith('share:token-to-revoke');
      expect(result).toBe(true);
    });

    it('should return false if token not found', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await shareService.revokeToken('nonexistent-token');

      expect(result).toBe(false);
    });
  });

  describe('isWorkInShare', () => {
    it('should return true for valid workId in share', async () => {
      const mockData: ShareTokenData = {
        workIds: ['work-1', 'work-2', 'work-3'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await shareService.isWorkInShare('valid-token', 'work-2');

      expect(result).toBe(true);
    });

    it('should return false for workId not in share', async () => {
      const mockData: ShareTokenData = {
        workIds: ['work-1', 'work-2'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await shareService.isWorkInShare('valid-token', 'work-999');

      expect(result).toBe(false);
    });

    it('should return false for invalid/expired token', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await shareService.isWorkInShare('invalid-token', 'work-1');

      expect(result).toBe(false);
    });
  });

  describe('listAllShares', () => {
    it('should list all active shares using SCAN', async () => {
      const mockShareData1 = {
        workIds: ['work-1'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now() - 1000,
      };
      const mockShareData2 = {
        workIds: ['work-2', 'work-3'],
        expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      // Mock SCAN to return two iterations
      mockRedis.scan
        .mockResolvedValueOnce(['1', ['share:token1']]) // First iteration, has more
        .mockResolvedValueOnce(['0', ['share:token2']]); // Second iteration, done

      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockShareData1))
        .mockResolvedValueOnce(JSON.stringify(mockShareData2));

      const result = await shareService.listAllShares();

      expect(result).toHaveLength(2);
      expect(result[0].token).toBe('token2'); // Sorted by createdAt DESC
      expect(result[1].token).toBe('token1');
    });
  });

  describe('getShareInfo', () => {
    it('should return share details for valid token', async () => {
      const mockData: ShareTokenData = {
        workIds: ['work-1'],
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await shareService.getShareInfo('my-token');

      expect(mockRedis.get).toHaveBeenCalledWith('share:my-token');
      expect(result).not.toBeNull();
      expect(result?.workIds).toEqual(['work-1']);
    });

    it('should return null for nonexistent token', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await shareService.getShareInfo('nonexistent-token');

      expect(result).toBeNull();
    });
  });
});