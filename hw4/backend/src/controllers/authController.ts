import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '../generated/prisma';
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
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL}/auth/google/callback`
);

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

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen
 */
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      redirect_uri: `${process.env.BASE_URL}/auth/google/callback`
    });

    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error from Google OAuth
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens or error
 *       400:
 *         description: Invalid authorization code
 */
export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code, error } = req.query;

    console.log('Google callback received:', { code: !!code, error });

    if (error) {
      console.error('Google OAuth error:', error);
      // Redirect to frontend with error
      const frontendUrl = `${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(error as string)}`;
      res.redirect(frontendUrl);
      return;
    }

    if (!code) {
      console.error('Missing authorization code');
      const frontendUrl = `${process.env.FRONTEND_URL}/auth/error?error=missing_code`;
      res.redirect(frontendUrl);
      return;
    }

    console.log('Attempting to exchange code for tokens...');
    console.log('Redirect URI:', `${process.env.BASE_URL}/auth/google/callback`);
    console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('Has Client Secret:', !!process.env.GOOGLE_CLIENT_SECRET);

    // Exchange authorization code for tokens
    const { tokens } = await googleClient.getToken({
      code: code as string,
      redirect_uri: `${process.env.BASE_URL}/auth/google/callback`
    });

    console.log('Successfully obtained tokens:', { hasIdToken: !!tokens.id_token });

    if (!tokens.id_token) {
      const frontendUrl = `${process.env.FRONTEND_URL}/auth/error?error=no_id_token`;
      res.redirect(frontendUrl);
      return;
    }

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      const frontendUrl = `${process.env.FRONTEND_URL}/auth/error?error=invalid_token`;
      res.redirect(frontendUrl);
      return;
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

    // Redirect to frontend with tokens
    const frontendUrl = `${process.env.FRONTEND_URL}/auth/success?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('Google callback error:', error);
    
    // If it's a Google OAuth error, redirect to frontend with error details
    if (error instanceof Error) {
      const frontendUrl = `${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(error.message)}`;
      res.redirect(frontendUrl);
    } else {
      next(error);
    }
  }
};

/**
 * Register new user with email and password
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { AuthService } = await import('../services/authService');
    const authService = new AuthService();
    
    const result = await authService.register(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Registration successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user with email and password
 */
export const loginWithPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { AuthService } = await import('../services/authService');
    const authService = new AuthService();
    
    const result = await authService.login(req.body);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};