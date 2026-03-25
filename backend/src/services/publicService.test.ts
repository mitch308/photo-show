import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to create mocks before they're referenced in vi.mock
const mockWorkRepo = vi.hoisted(() => ({
  createQueryBuilder: vi.fn(),
  findOne: vi.fn(),
  increment: vi.fn(),
}));

const mockAlbumRepo = vi.hoisted(() => ({
  createQueryBuilder: vi.fn(),
  find: vi.fn(),
}));

const mockTagRepo = vi.hoisted(() => ({
  createQueryBuilder: vi.fn(),
  find: vi.fn(),
}));

// Mock AppDataSource before importing the service
vi.mock('../config/database.js', () => ({
  AppDataSource: {
    getRepository: vi.fn((entity: any) => {
      // Return the appropriate mock based on entity name
      if (entity?.name === 'Work') return mockWorkRepo;
      if (entity?.name === 'Album') return mockAlbumRepo;
      if (entity?.name === 'Tag') return mockTagRepo;
      return null;
    }),
  },
}));

// Import after mock is set up
import { PublicService } from './publicService.js';

describe('PublicService', () => {
  let publicService: PublicService;

  beforeEach(() => {
    vi.clearAllMocks();
    publicService = new PublicService();
  });

  describe('getPublicWorks', () => {
    it('should return only isPublic=true works', async () => {
      const mockWorks = [
        { id: '1', title: 'Public Work 1', isPublic: true },
        { id: '2', title: 'Public Work 2', isPublic: true },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockWorks),
        getCount: vi.fn().mockResolvedValue(2),
      };

      mockWorkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await publicService.getPublicWorks();

      expect(mockWorkRepo.createQueryBuilder).toHaveBeenCalledWith('work');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('work.isPublic = :isPublic', { isPublic: true });
      expect(result.works).toEqual(mockWorks);
      expect(result.total).toBe(2);
    });

    it('should filter by albumId correctly', async () => {
      const mockWorks = [
        { id: '1', title: 'Work in Album', isPublic: true, albums: [{ id: 'album-1' }] },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockWorks),
        getCount: vi.fn().mockResolvedValue(1),
      };

      mockWorkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await publicService.getPublicWorks({ albumId: 'album-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('albums.id = :albumId', { albumId: 'album-1' });
      expect(result.works).toEqual(mockWorks);
    });

    it('should filter by tagId correctly', async () => {
      const mockWorks = [
        { id: '1', title: 'Work with Tag', isPublic: true, tags: [{ id: 'tag-1' }] },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockWorks),
        getCount: vi.fn().mockResolvedValue(1),
      };

      mockWorkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await publicService.getPublicWorks({ tagId: 'tag-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('tags.id = :tagId', { tagId: 'tag-1' });
      expect(result.works).toEqual(mockWorks);
    });

    it('should support pagination with limit and offset', async () => {
      const mockWorks = [
        { id: '1', title: 'Work 1', isPublic: true },
        { id: '2', title: 'Work 2', isPublic: true },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockWorks),
        getCount: vi.fn().mockResolvedValue(10),
      };

      mockWorkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await publicService.getPublicWorks({ limit: 2, offset: 4 });

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(2);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(4);
      expect(result.works).toEqual(mockWorks);
      expect(result.total).toBe(10);
      expect(result.hasMore).toBe(true); // 4 + 2 < 10
    });

    it('should return hasMore=false when no more results', async () => {
      const mockWorks = [
        { id: '1', title: 'Work 1', isPublic: true },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockWorks),
        getCount: vi.fn().mockResolvedValue(1),
      };

      mockWorkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await publicService.getPublicWorks({ limit: 20, offset: 0 });

      expect(result.hasMore).toBe(false); // 0 + 1 = 1, total is 1, not less
    });
  });

  describe('searchPublicWorks', () => {
    it('should return works matching title or description', async () => {
      const mockWorks = [
        { id: '1', title: 'Sunset Photo', description: 'Beautiful sunset', isPublic: true },
        { id: '2', title: 'Mountain View', description: 'Sunset over mountains', isPublic: true },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        setParameters: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockWorks),
        getCount: vi.fn().mockResolvedValue(2),
      };

      mockWorkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await publicService.searchPublicWorks('sunset');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result.works).toEqual(mockWorks);
    });

    it('should apply isPublic=true filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        setParameters: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
        getCount: vi.fn().mockResolvedValue(0),
      };

      mockWorkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await publicService.searchPublicWorks('test');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('work.isPublic = :isPublic', { isPublic: true });
    });
  });

  describe('getPublicWorkById', () => {
    it('should return work only if isPublic=true', async () => {
      const mockWork = { id: '1', title: 'Public Work', isPublic: true, viewCount: 0 };

      mockWorkRepo.findOne.mockResolvedValue(mockWork);

      const result = await publicService.getPublicWorkById('1');

      expect(mockWorkRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1', isPublic: true },
        relations: ['albums', 'tags', 'mediaItems'],
        order: {
          mediaItems: {
            position: 'ASC',
          },
        },
      });
      expect(result).toEqual(mockWork);
    });

    it('should return null for non-public work', async () => {
      mockWorkRepo.findOne.mockResolvedValue(null);

      const result = await publicService.getPublicWorkById('private-id');

      expect(result).toBeNull();
    });

    it('should increment viewCount after fetching', async () => {
      const mockWork = { id: '1', title: 'Public Work', isPublic: true, viewCount: 5 };

      mockWorkRepo.findOne.mockResolvedValue(mockWork);

      await publicService.getPublicWorkById('1');

      expect(mockWorkRepo.increment).toHaveBeenCalledWith({ id: '1' }, 'viewCount', 1);
    });
  });

  describe('getPublicAlbums', () => {
    it('should return all albums with work count', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          {
            id: '1',
            name: 'Album 1',
            coverPath: '/cover1.jpg',
            works: [
              { id: 'w1', isPublic: true, mediaItems: [{ thumbnailSmall: '/thumb1.jpg' }] },
              { id: 'w2', isPublic: true, mediaItems: [] },
            ],
          },
          {
            id: '2',
            name: 'Album 2',
            coverPath: '/cover2.jpg',
            works: [
              { id: 'w3', isPublic: true, mediaItems: [{ thumbnailSmall: '/thumb3.jpg' }] },
            ],
          },
        ]),
      };

      mockAlbumRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await publicService.getPublicAlbums();

      expect(result).toHaveLength(2);
      expect(result[0].workCount).toBe(2);
      expect(result[1].workCount).toBe(1);
    });
  });

  describe('getPublicTags', () => {
    it('should return all tags with public work count only', async () => {
      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { id: '1', name: 'Nature', workCount: '10' },
          { id: '2', name: 'Portrait', workCount: '5' },
        ]),
      };

      mockTagRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await publicService.getPublicTags();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('work.isPublic = :isPublic', { isPublic: true });
      expect(result).toHaveLength(2);
      expect(result[0].workCount).toBe(10);
    });
  });
});