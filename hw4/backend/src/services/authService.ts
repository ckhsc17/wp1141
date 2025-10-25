import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {
  GoogleUserInfo,
  UserDTO,
  LoginResponse,
  ServiceResult,
  RegisterRequest,
  LoginRequest
} from '../types';
import { generateTokens } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { PasswordService } from './passwordService';
import { JWTService } from './jwtService';

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
   * Complete Google OAuth login process
   */
  async loginWithGoogle(googleToken: string): Promise<ServiceResult<LoginResponse>> {
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
   * Register new user with email and password
   */
  async register(data: RegisterRequest): Promise<ServiceResult<LoginResponse>> {
    try {
      // 驗證密碼強度
      const passwordValidation = PasswordService.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        };
      }

      // 檢查 email 是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered'
        };
      }

      // 雜湊密碼
      const hashedPassword = await PasswordService.hashPassword(data.password);

      // 創建用戶
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          avatar: data.avatar
        }
      });

      // 生成 tokens
      const accessToken = JWTService.generateAccessToken({
        userId: user.id,
        email: user.email
      });

      const refreshToken = JWTService.generateRefreshToken({
        userId: user.id,
        email: user.email
      });

      // 轉換為 DTO
      const userDTO: UserDTO = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      };

      return {
        success: true,
        data: {
          user: userDTO,
          accessToken,
          refreshToken
        }
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Failed to register user'
      };
    }
  }

  /**
   * Login user with email and password
   */
  async login(data: LoginRequest): Promise<ServiceResult<LoginResponse>> {
    try {
      // 查找用戶
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // 檢查是否為 OAuth 用戶
      if (!user.password) {
        return {
          success: false,
          error: 'This account was registered with Google. Please use Google Sign-In.'
        };
      }

      // 驗證密碼
      const isValidPassword = await PasswordService.verifyPassword(data.password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // 生成 tokens
      const accessToken = JWTService.generateAccessToken({
        userId: user.id,
        email: user.email
      });

      const refreshToken = JWTService.generateRefreshToken({
        userId: user.id,
        email: user.email
      });

      // 轉換為 DTO
      const userDTO: UserDTO = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      };

      return {
        success: true,
        data: {
          user: userDTO,
          accessToken,
          refreshToken
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Failed to login'
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