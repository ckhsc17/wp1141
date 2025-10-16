import { Request, Response } from 'express';
import { ApiError } from '../types';

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ApiError = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: {
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString()
      }
    }
  };

  res.status(404).json(errorResponse);
};