import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma';
import { AuthenticatedRequest, JWTPayload } from '../types';
import { createError } from './errorHandler';

const prisma = new PrismaClient();

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError.unauthorized('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw createError.internalServer('JWT secret is not configured');
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, secretKey) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError.unauthorized('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError.unauthorized('Invalid access token');
      }
      throw createError.unauthorized('Token verification failed');
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true
      }
    });

    if (!user) {
      throw createError.unauthorized('User no longer exists');
    }

    // Attach user to request object
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, secretKey) as JWTPayload;
      
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true
        }
      });

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Invalid token, but continue without authentication
      console.warn('Optional authentication failed:', error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to generate and verify refresh tokens
export const generateTokens = (userId: string, email: string) => {
  const secretKey = process.env.JWT_SECRET;
  const refreshSecretKey = process.env.JWT_REFRESH_SECRET;
  
  if (!secretKey || !refreshSecretKey) {
    throw createError.internalServer('JWT secrets are not configured');
  }

  const payload: JWTPayload = {
    userId,
    email
  };

  const accessToken = jwt.sign(payload, secretKey, {
    expiresIn: '1h',
    issuer: 'treasure-map-api',
    audience: 'treasure-map-client'
  });

  const refreshToken = jwt.sign(payload, refreshSecretKey, {
    expiresIn: '7d',
    issuer: 'treasure-map-api',
    audience: 'treasure-map-client'
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (refreshToken: string): JWTPayload => {
  const refreshSecretKey = process.env.JWT_REFRESH_SECRET;
  
  if (!refreshSecretKey) {
    throw createError.internalServer('JWT refresh secret is not configured');
  }

  try {
    return jwt.verify(refreshToken, refreshSecretKey) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createError.unauthorized('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw createError.unauthorized('Invalid refresh token');
    }
    throw createError.unauthorized('Refresh token verification failed');
  }
};