import { TreasureService } from '../../src/services/treasureService';
import { PrismaClient } from '@prisma/client';
import { TreasureType } from '../../src/types';

// Mock Prisma
jest.mock('@prisma/client');

const mockPrisma = {
  treasure: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  }
};

(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

describe('TreasureService', () => {
  let treasureService: TreasureService;

  beforeEach(() => {
    jest.clearAllMocks();
    treasureService = new TreasureService();
  });

  describe('createTreasure', () => {
    it('should create a treasure successfully', async () => {
      const treasureData = {
        title: 'Test Treasure',
        content: 'A test treasure content',
        type: TreasureType.MUSIC,
        latitude: 25.0330,
        longitude: 121.5654,
        address: 'Test Address',
        tags: ['test', 'music'],
        isLiveLocation: false
      };

      const userId = 'user-123';
      const mockCreatedTreasure = {
        id: 'treasure-123',
        ...treasureData,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          avatar: 'avatar.jpg'
        }
      };

      mockPrisma.treasure.create.mockResolvedValue(mockCreatedTreasure);

      const result = await treasureService.createTreasure(treasureData, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockPrisma.treasure.create).toHaveBeenCalled();
    });

    it('should handle database error during creation', async () => {
      const treasureData = {
        title: 'Test Treasure',
        content: 'A test treasure content',
        type: TreasureType.TEXT,
        latitude: 25.0330,
        longitude: 121.5654,
        tags: ['test']
      };

      mockPrisma.treasure.create.mockRejectedValue(new Error('Database error'));

      const result = await treasureService.createTreasure(treasureData, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create treasure');
    });
  });

  describe('getTreasureById', () => {
    it('should return treasure when found', async () => {
      const treasureId = 'treasure-123';
      const mockTreasure = {
        id: treasureId,
        title: 'Test Treasure',
        content: 'Test content',
        type: TreasureType.MUSIC,
        latitude: 25.0330,
        longitude: 121.5654,
        userId: 'user-123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          avatar: 'avatar.jpg'
        },
        _count: {
          likes: 0,
          comments: 0
        }
      };

      mockPrisma.treasure.findUnique.mockResolvedValue(mockTreasure);

      const result = await treasureService.getTreasureById(treasureId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error when treasure not found', async () => {
      mockPrisma.treasure.findUnique.mockResolvedValue(null);

      const result = await treasureService.getTreasureById('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Treasure not found');
    });
  });

  describe('getTreasures', () => {
    it('should get treasures with default parameters', async () => {
      const mockTreasures = [
        {
          id: 'treasure-1',
          title: 'Test Treasure 1',
          content: 'Content 1',
          type: TreasureType.MUSIC,
          latitude: 25.0330,
          longitude: 121.5654,
          user: {
            id: 'user-1',
            email: 'user1@example.com',
            name: 'User 1',
            avatar: 'avatar1.jpg'
          },
          _count: {
            likes: 0,
            comments: 0
          }
        }
      ];

      const mockCount = 1;

      mockPrisma.treasure.findMany.mockResolvedValue(mockTreasures);
      mockPrisma.treasure.count.mockResolvedValue(mockCount);

      const result = await treasureService.getTreasures({});

      expect(result.success).toBe(true);
      expect(result.data?.treasures).toBeDefined();
      expect(result.data?.total).toBe(mockCount);
    });
  });
});

    it('should handle database error during creation', async () => {
      const treasureData = {
        title: 'Test Treasure',
        description: 'A test treasure',
        latitude: 25.0330,
        longitude: 121.5654,
        hint: 'Look for the red building',
        difficulty: 3,
        points: 100,
        radius: 50
      };

      mockPrisma.treasure.create.mockRejectedValue(new Error('Database error'));

      const result = await treasureService.createTreasure('user-123', treasureData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create treasure');
    });
  });

  describe('getTreasureById', () => {
    it('should return treasure when found', async () => {
      const treasureId = 'treasure-123';
      const mockTreasure = {
        id: treasureId,
        title: 'Test Treasure',
        description: 'A test treasure',
        latitude: 25.0330,
        longitude: 121.5654,
        hint: 'Look for the red building',
        difficulty: 3,
        points: 100,
        radius: 50,
        userId: 'user-123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          name: 'Test User',
          avatar: 'avatar.jpg'
        }
      };

      mockPrisma.treasure.findUnique.mockResolvedValue(mockTreasure);

      const result = await treasureService.getTreasureById(treasureId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTreasure);
    });

    it('should return error when treasure not found', async () => {
      mockPrisma.treasure.findUnique.mockResolvedValue(null);

      const result = await treasureService.getTreasureById('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Treasure not found');
    });
  });

  describe('searchTreasures', () => {
    it('should search treasures with filters', async () => {
      const searchParams = {
        latitude: 25.0330,
        longitude: 121.5654,
        radius: 1000,
        difficulty: 3,
        title: 'test'
      };

      const mockTreasures = [
        {
          id: 'treasure-1',
          title: 'Test Treasure 1',
          description: 'First test treasure',
          latitude: 25.0330,
          longitude: 121.5654,
          difficulty: 3,
          points: 100,
          isActive: true,
          user: {
            id: 'user-1',
            name: 'User 1',
            avatar: 'avatar1.jpg'
          }
        }
      ];

      const mockCount = 1;

      mockPrisma.treasure.findMany.mockResolvedValue(mockTreasures);
      mockPrisma.treasure.count.mockResolvedValue(mockCount);

      const result = await treasureService.searchTreasures(searchParams);

      expect(result.success).toBe(true);
      expect(result.data?.treasures).toEqual(mockTreasures);
      expect(result.data?.total).toBe(mockCount);
    });

    it('should handle search without filters', async () => {
      const searchParams = {};
      const mockTreasures = [];
      const mockCount = 0;

      mockPrisma.treasure.findMany.mockResolvedValue(mockTreasures);
      mockPrisma.treasure.count.mockResolvedValue(mockCount);

      const result = await treasureService.searchTreasures(searchParams);

      expect(result.success).toBe(true);
      expect(result.data?.treasures).toEqual(mockTreasures);
      expect(result.data?.total).toBe(mockCount);
    });
  });

  describe('updateTreasure', () => {
    it('should update treasure successfully', async () => {
      const treasureId = 'treasure-123';
      const userId = 'user-123';
      const updateData = {
        title: 'Updated Treasure',
        description: 'Updated description'
      };

      const existingTreasure = {
        id: treasureId,
        userId,
        title: 'Old Title',
        description: 'Old description'
      };

      const updatedTreasure = {
        ...existingTreasure,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.treasure.findUnique.mockResolvedValue(existingTreasure);
      mockPrisma.treasure.update.mockResolvedValue(updatedTreasure);

      const result = await treasureService.updateTreasure(treasureId, userId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedTreasure);
    });

    it('should return error when treasure not found', async () => {
      mockPrisma.treasure.findUnique.mockResolvedValue(null);

      const result = await treasureService.updateTreasure('non-existent', 'user-123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Treasure not found');
    });

    it('should return error when user is not owner', async () => {
      const existingTreasure = {
        id: 'treasure-123',
        userId: 'different-user',
        title: 'Test Treasure'
      };

      mockPrisma.treasure.findUnique.mockResolvedValue(existingTreasure);

      const result = await treasureService.updateTreasure('treasure-123', 'user-123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authorized to update this treasure');
    });
  });

  describe('deleteTreasure', () => {
    it('should delete treasure successfully', async () => {
      const treasureId = 'treasure-123';
      const userId = 'user-123';

      const existingTreasure = {
        id: treasureId,
        userId,
        title: 'Test Treasure'
      };

      mockPrisma.treasure.findUnique.mockResolvedValue(existingTreasure);
      mockPrisma.treasure.delete.mockResolvedValue(existingTreasure);

      const result = await treasureService.deleteTreasure(treasureId, userId);

      expect(result.success).toBe(true);
      expect(mockPrisma.treasure.delete).toHaveBeenCalledWith({
        where: { id: treasureId }
      });
    });

    it('should return error when treasure not found', async () => {
      mockPrisma.treasure.findUnique.mockResolvedValue(null);

      const result = await treasureService.deleteTreasure('non-existent', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Treasure not found');
    });

    it('should return error when user is not owner', async () => {
      const existingTreasure = {
        id: 'treasure-123',
        userId: 'different-user',
        title: 'Test Treasure'
      };

      mockPrisma.treasure.findUnique.mockResolvedValue(existingTreasure);

      const result = await treasureService.deleteTreasure('treasure-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authorized to delete this treasure');
    });
  });
});