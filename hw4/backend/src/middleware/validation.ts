import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { TreasureType } from '../types';

// Helper function to validate required fields
const validateRequired = (value: any, fieldName: string) => {
  if (value === undefined || value === null || value === '') {
    throw createError.badRequest(`${fieldName} is required`);
  }
};

// Helper function to validate string length
const validateLength = (value: string, fieldName: string, min: number, max: number) => {
  if (value.length < min || value.length > max) {
    throw createError.badRequest(`${fieldName} must be between ${min} and ${max} characters`);
  }
};

// Helper function to validate UUID
const validateUUID = (value: string, fieldName: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw createError.badRequest(`Invalid ${fieldName}`);
  }
};

// Helper function to validate CUID (used by Prisma)
const validateCUID = (value: string, fieldName: string) => {
  // CUID format: c + timestamp (8 chars) + counter (4 chars) + fingerprint (4 chars) + random (8 chars)
  // Example: cl9ebqhxk00008vs83z1fkjyd
  const cuidRegex = /^c[a-z0-9]{24,}$/i;
  if (!cuidRegex.test(value)) {
    throw createError.badRequest(`Invalid ${fieldName}`);
  }
};

// Helper function to validate latitude
const validateLatitude = (value: number, fieldName: string) => {
  if (value < -90 || value > 90) {
    throw createError.badRequest(`${fieldName} must be between -90 and 90`);
  }
};

// Helper function to validate longitude
const validateLongitude = (value: number, fieldName: string) => {
  if (value < -180 || value > 180) {
    throw createError.badRequest(`${fieldName} must be between -180 and 180`);
  }
};

// Helper function to validate URL
const validateURL = (value: string, fieldName: string) => {
  try {
    new URL(value);
  } catch {
    throw createError.badRequest(`${fieldName} must be a valid URL`);
  }
};

// ==================== Auth Validations ====================

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { googleToken } = req.body;
    
    validateRequired(googleToken, 'Google token');
    
    if (typeof googleToken !== 'string') {
      throw createError.badRequest('Google token must be a string');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const validateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    validateRequired(refreshToken, 'Refresh token');
    
    if (typeof refreshToken !== 'string') {
      throw createError.badRequest('Refresh token must be a string');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// ==================== Treasure Validations ====================

export const validateCreateTreasure = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, type, latitude, longitude, address, linkUrl, tags, isLiveLocation } = req.body;
    
    // Required fields
    validateRequired(title, 'Title');
    validateRequired(content, 'Content');
    validateRequired(type, 'Type');
    validateRequired(latitude, 'Latitude');
    validateRequired(longitude, 'Longitude');
    validateRequired(tags, 'Tags');
    
    // Type validations
    if (typeof title !== 'string') {
      throw createError.badRequest('Title must be a string');
    }
    validateLength(title, 'Title', 1, 200);
    
    if (typeof content !== 'string') {
      throw createError.badRequest('Content must be a string');
    }
    validateLength(content, 'Content', 1, 2000);
    
    if (!Object.values(TreasureType).includes(type)) {
      throw createError.badRequest(`Type must be one of: ${Object.values(TreasureType).join(', ')}`);
    }
    
    if (typeof latitude !== 'number') {
      throw createError.badRequest('Latitude must be a number');
    }
    validateLatitude(latitude, 'Latitude');
    
    if (typeof longitude !== 'number') {
      throw createError.badRequest('Longitude must be a number');
    }
    validateLongitude(longitude, 'Longitude');
    
    // Optional fields
    if (address !== undefined) {
      if (typeof address !== 'string') {
        throw createError.badRequest('Address must be a string');
      }
      validateLength(address, 'Address', 0, 500);
    }
    
    if (linkUrl !== undefined) {
      if (typeof linkUrl !== 'string') {
        throw createError.badRequest('Link URL must be a string');
      }
      validateURL(linkUrl, 'Link URL');
    }
    
    if (!Array.isArray(tags)) {
      throw createError.badRequest('Tags must be an array');
    }
    
    if (tags.length > 10) {
      throw createError.badRequest('Maximum 10 tags allowed');
    }
    
    for (const tag of tags) {
      if (typeof tag !== 'string') {
        throw createError.badRequest('Each tag must be a string');
      }
      if (tag.length > 50) {
        throw createError.badRequest('Each tag must not exceed 50 characters');
      }
    }
    
    if (isLiveLocation !== undefined && typeof isLiveLocation !== 'boolean') {
      throw createError.badRequest('isLiveLocation must be a boolean');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateTreasure = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, content, tags, linkUrl } = req.body;
    
    validateUUID(id, 'treasure ID');
    
    if (title !== undefined) {
      if (typeof title !== 'string') {
        throw createError.badRequest('Title must be a string');
      }
      validateLength(title, 'Title', 1, 200);
    }
    
    if (content !== undefined) {
      if (typeof content !== 'string') {
        throw createError.badRequest('Content must be a string');
      }
      validateLength(content, 'Content', 1, 2000);
    }
    
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        throw createError.badRequest('Tags must be an array');
      }
      
      if (tags.length > 10) {
        throw createError.badRequest('Maximum 10 tags allowed');
      }
      
      for (const tag of tags) {
        if (typeof tag !== 'string') {
          throw createError.badRequest('Each tag must be a string');
        }
        if (tag.length > 50) {
          throw createError.badRequest('Each tag must not exceed 50 characters');
        }
      }
    }
    
    if (linkUrl !== undefined) {
      if (typeof linkUrl !== 'string') {
        throw createError.badRequest('Link URL must be a string');
      }
      validateURL(linkUrl, 'Link URL');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const validateTreasureQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius, type, tags, userId, page, limit } = req.query;
    
    if (latitude !== undefined) {
      const lat = parseFloat(latitude as string);
      if (isNaN(lat)) {
        throw createError.badRequest('Latitude must be a number');
      }
      validateLatitude(lat, 'Latitude');
    }
    
    if (longitude !== undefined) {
      const lng = parseFloat(longitude as string);
      if (isNaN(lng)) {
        throw createError.badRequest('Longitude must be a number');
      }
      validateLongitude(lng, 'Longitude');
    }
    
    if (radius !== undefined) {
      const r = parseFloat(radius as string);
      if (isNaN(r) || r < 0.1 || r > 1000) {
        throw createError.badRequest('Radius must be between 0.1 and 1000 km');
      }
    }
    
    if (type !== undefined && !Object.values(TreasureType).includes(type as TreasureType)) {
      throw createError.badRequest(`Type must be one of: ${Object.values(TreasureType).join(', ')}`);
    }
    
    if (userId !== undefined) {
      validateUUID(userId as string, 'user ID');
    }
    
    if (page !== undefined) {
      const p = parseInt(page as string);
      if (isNaN(p) || p < 1) {
        throw createError.badRequest('Page must be a positive integer');
      }
    }
    
    if (limit !== undefined) {
      const l = parseInt(limit as string);
      if (isNaN(l) || l < 1 || l > 100) {
        throw createError.badRequest('Limit must be between 1 and 100');
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// ==================== Comment Validations ====================

export const validateCreateComment = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { treasureId } = req.params;
    const { content } = req.body;
    
    validateUUID(treasureId, 'treasure ID');
    validateRequired(content, 'Content');
    
    if (typeof content !== 'string') {
      throw createError.badRequest('Content must be a string');
    }
    
    validateLength(content, 'Content', 1, 500);
    
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateComment = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    validateUUID(id, 'comment ID');
    validateRequired(content, 'Content');
    
    if (typeof content !== 'string') {
      throw createError.badRequest('Content must be a string');
    }
    
    validateLength(content, 'Content', 1, 500);
    
    next();
  } catch (error) {
    next(error);
  }
};

// ==================== Common Validations ====================

export const validateCUIDParam = (paramName: string = 'id') => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = req.params[paramName];
      validateCUID(value, paramName);
      next();
    } catch (error) {
      next(error);
    }
  };

// 保留舊的 UUID 驗證以便向後兼容（但實際上使用 CUID 驗證）
export const validateUUIDParam = (paramName: string = 'id') => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = req.params[paramName];
      validateCUID(value, paramName); // 使用 CUID 驗證而不是 UUID
      next();
    } catch (error) {
      next(error);
    }
  };

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    
    if (page !== undefined) {
      const p = parseInt(page as string);
      if (isNaN(p) || p < 1) {
        throw createError.badRequest('Page must be a positive integer');
      }
    }
    
    if (limit !== undefined) {
      const l = parseInt(limit as string);
      if (isNaN(l) || l < 1 || l > 100) {
        throw createError.badRequest('Limit must be between 1 and 100');
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// ==================== File Upload Validations ====================

export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    
    if (!file) {
      throw createError.badRequest('File is required');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw createError.badRequest('File size exceeds 10MB limit');
    }

    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/webm'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw createError.badRequest('File type not supported');
    }

    next();
  } catch (error) {
    next(error);
  }
};