import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import {
  GoogleUserInfo,
  UserDTO,
  LoginResponse,
  ServiceResult
} from '../types';
import { generateTokens } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  /**
   * Verify Google OAuth token and get user info
   */
  async verifyGoogleToken(token: string): Promise<ServiceResult<GoogleUserInfo>> {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return {
          success: false,
          error: 'Invalid Google token'
        };
      }

      const googleUserInfo: GoogleUserInfo = {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture
      };

      return {
        success: true,
        data: googleUserInfo
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to verify Google token'
      };
    }
  }

  /**
   * Find or create user from Google info
   */
  async findOrCreateUser(googleUserInfo: GoogleUserInfo): Promise<ServiceResult<UserDTO>> {
    try {
      // Try to find existing user
      let user = await prisma.user.findUnique({
        where: { googleId: googleUserInfo.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true
        }
      });

      if (!user) {
        // Create new user
        const newUser = await prisma.user.create({
          data: {
            email: googleUserInfo.email,
            name: googleUserInfo.name,
            avatar: googleUserInfo.picture,
            googleId: googleUserInfo.id
          },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        });
        user = newUser;
      } else {
        // Update existing user info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: googleUserInfo.email,
            name: googleUserInfo.name,
            avatar: googleUserInfo.picture,
            updatedAt: new Date()
          },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        });
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create or update user'
      };
    }
  }

  /**
   * Complete login process
   */
  async login(googleToken: string): Promise<ServiceResult<LoginResponse>> {
    try {
      // Verify Google token
      const googleResult = await this.verifyGoogleToken(googleToken);
      if (!googleResult.success || !googleResult.data) {
        return {
          success: false,
          error: googleResult.error || 'Failed to verify Google token'
        };
      }

      // Find or create user
      const userResult = await this.findOrCreateUser(googleResult.data);
      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: userResult.error || 'Failed to process user'
        };
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        userResult.data.id,
        userResult.data.email
      );

      const loginResponse: LoginResponse = {
        user: userResult.data,
        accessToken,
        refreshToken
      };

      return {
        success: true,
        data: loginResponse
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<ServiceResult<UserDTO>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user'
      };
    }
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      return !!user;
    } catch (error) {
      return false;
    }
  }
}