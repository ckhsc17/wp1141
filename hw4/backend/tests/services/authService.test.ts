import { AuthService } from '../../src/services/authService';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

// Mock external dependencies
jest.mock('@prisma/client');
jest.mock('google-auth-library');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
};

const mockGoogleClient = {
  verifyIdToken: jest.fn()
};

// Mock the PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

// Mock the OAuth2Client constructor  
(OAuth2Client as jest.MockedClass<typeof OAuth2Client>).mockImplementation(() => mockGoogleClient as any);

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('verifyGoogleToken', () => {
    it('should verify valid Google token', async () => {
      const mockPayload = {
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      };

      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockPayload)
      };

      mockGoogleClient.verifyIdToken.mockResolvedValue(mockTicket);

      const result = await authService.verifyGoogleToken('valid-token');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      });
    });

    it('should handle invalid Google token', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(null)
      };

      mockGoogleClient.verifyIdToken.mockResolvedValue(mockTicket);

      const result = await authService.verifyGoogleToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Google token');
    });

    it('should handle Google verification error', async () => {
      mockGoogleClient.verifyIdToken.mockRejectedValue(new Error('Verification failed'));

      const result = await authService.verifyGoogleToken('error-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to verify Google token');
    });
  });

  describe('findOrCreateUser', () => {
    const mockGoogleUserInfo = {
      id: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    it('should create new user when not exists', async () => {
      const mockNewUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockNewUser);

      const result = await authService.findOrCreateUser(mockGoogleUserInfo);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNewUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: mockGoogleUserInfo.email,
          name: mockGoogleUserInfo.name,
          avatar: mockGoogleUserInfo.picture,
          googleId: mockGoogleUserInfo.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true
        }
      });
    });

    it('should update existing user', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'old@example.com',
        name: 'Old User',
        avatar: 'https://example.com/old-avatar.jpg'
      };

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg'
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await authService.findOrCreateUser(mockGoogleUserInfo);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: {
          email: mockGoogleUserInfo.email,
          name: mockGoogleUserInfo.name,
          avatar: mockGoogleUserInfo.picture,
          updatedAt: expect.any(Date)
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true
        }
      });
    });

    it('should handle database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await authService.findOrCreateUser(mockGoogleUserInfo);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create or update user');
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getUserById('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should return error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.getUserById('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await authService.getUserById('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user');
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });

      const exists = await authService.userExists('user-123');

      expect(exists).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const exists = await authService.userExists('non-existent');

      expect(exists).toBe(false);
    });

    it('should return false on database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const exists = await authService.userExists('user-123');

      expect(exists).toBe(false);
    });
  });
});