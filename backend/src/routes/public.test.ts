import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Use vi.hoisted for mock to work with hoisted vi.mock
const mockPublicService = vi.hoisted(() => ({
  getPublicWorks: vi.fn(),
  searchPublicWorks: vi.fn(),
  getPublicWorkById: vi.fn(),
  getPublicAlbums: vi.fn(),
  getPublicTags: vi.fn(),
}));

vi.mock('../services/publicService.js', () => ({
  publicService: mockPublicService,
}));

// Import after mock is set up
import publicRoutes from './public.js';

describe('Public Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/public', publicRoutes);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/public/works', () => {
    it('should return 200 without auth', async () => {
      mockPublicService.getPublicWorks.mockResolvedValue({
        works: [],
        total: 0,
        hasMore: false,
      });

      const response = await request(app).get('/api/public/works');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.works).toEqual([]);
    });

    it('should filter by albumId correctly', async () => {
      const mockWorks = [
        { id: '1', title: 'Work in Album', isPublic: true },
      ];

      mockPublicService.getPublicWorks.mockResolvedValue({
        works: mockWorks,
        total: 1,
        hasMore: false,
      });

      const response = await request(app)
        .get('/api/public/works')
        .query({ albumId: 'album-1' });

      expect(response.status).toBe(200);
      expect(mockPublicService.getPublicWorks).toHaveBeenCalledWith(
        expect.objectContaining({ albumId: 'album-1' })
      );
    });

    it('should use searchPublicWorks when q param exists', async () => {
      mockPublicService.searchPublicWorks.mockResolvedValue({
        works: [{ id: '1', title: 'Test Work' }],
        total: 1,
        hasMore: false,
      });

      const response = await request(app)
        .get('/api/public/works')
        .query({ q: 'test' });

      expect(response.status).toBe(200);
      expect(mockPublicService.searchPublicWorks).toHaveBeenCalledWith('test', expect.any(Object));
    });

    it('should use pagination params', async () => {
      mockPublicService.getPublicWorks.mockResolvedValue({
        works: [],
        total: 100,
        hasMore: true,
      });

      await request(app)
        .get('/api/public/works')
        .query({ limit: '10', offset: '20' });

      expect(mockPublicService.getPublicWorks).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 20 })
      );
    });
  });

  describe('GET /api/public/works/:id', () => {
    it('should return work when found', async () => {
      const mockWork = {
        id: '1',
        title: 'Public Work',
        description: 'A public work',
        isPublic: true,
      };

      mockPublicService.getPublicWorkById.mockResolvedValue(mockWork);

      const response = await request(app).get('/api/public/works/1');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data).toEqual(mockWork);
    });

    it('should return 404 for non-public work', async () => {
      mockPublicService.getPublicWorkById.mockResolvedValue(null);

      const response = await request(app).get('/api/public/works/private-id');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });
  });

  describe('GET /api/public/albums', () => {
    it('should return all albums', async () => {
      const mockAlbums = [
        { id: '1', name: 'Album 1', workCount: 5 },
        { id: '2', name: 'Album 2', workCount: 3 },
      ];

      mockPublicService.getPublicAlbums.mockResolvedValue(mockAlbums);

      const response = await request(app).get('/api/public/albums');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data).toEqual(mockAlbums);
    });
  });

  describe('GET /api/public/tags', () => {
    it('should return all tags', async () => {
      const mockTags = [
        { id: '1', name: 'Nature', workCount: 10 },
        { id: '2', name: 'Portrait', workCount: 5 },
      ];

      mockPublicService.getPublicTags.mockResolvedValue(mockTags);

      const response = await request(app).get('/api/public/tags');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data).toEqual(mockTags);
    });
  });
});