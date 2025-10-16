import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { 
  AuthenticatedRequest, 
  LoginRequest, 
  LoginResponse, 
  ApiResponse,
  GoogleUserInfo 
} from '../types';
import { generateTokens, verifyRefreshToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with Google OAuth
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Invalid Google token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { googleToken }: LoginRequest = req.body;

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw createError.unauthorized('Invalid Google token');
    }

    const googleUserInfo: GoogleUserInfo = {
      id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture
    };

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { googleId: googleUserInfo.id }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          avatar: googleUserInfo.picture,
          googleId: googleUserInfo.id
        }
      });
    } else {
      // Update existing user info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          avatar: googleUserInfo.picture,
          updatedAt: new Date()
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar
        },
        accessToken,
        refreshToken
      },
      message: 'Login successful'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: JWT refresh token
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw createError.unauthorized('User no longer exists');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id, 
      user.email
    );

    const response: ApiResponse<{ accessToken: string; refreshToken: string }> = {
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      },
      message: 'Token refreshed successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw createError.unauthorized('User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError.notFound('User not found');
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      message: 'Profile retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout (client-side token removal)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Logged out successfully
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // For JWT-based auth, logout is primarily handled on client-side
    // This endpoint serves as a confirmation and can be used for logging
    
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Logged out successfully'
      },
      message: 'Please remove the access token from client storage'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};