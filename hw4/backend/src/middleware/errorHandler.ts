import { Request, Response, NextFunction } from 'express';
import { 
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError
} from '@prisma/client/runtime/library';
import { ApiError } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong';
  let details: any = undefined;

  // Log error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle different error types
  if (error instanceof AppError) {
    // Custom application errors
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (error instanceof PrismaClientKnownRequestError) {
    // Prisma known errors
    const prismaError = error as PrismaClientKnownRequestError;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this information already exists';
        details = prismaError.meta;
        break;
      case 'P2025':
        statusCode = 404;
        code = 'RECORD_NOT_FOUND';
        message = 'The requested record was not found';
        details = prismaError.meta;
        break;
      case 'P2003':
        statusCode = 400;
        code = 'FOREIGN_KEY_CONSTRAINT';
        message = 'Foreign key constraint failed';
        details = prismaError.meta;
        break;
      case 'P2014':
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'The provided ID is invalid';
        details = prismaError.meta;
        break;
      default:
        statusCode = 400;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
        details = prismaError.meta;
    }
  } else if (error instanceof PrismaClientUnknownRequestError) {
    // Prisma unknown errors
    statusCode = 500;
    code = 'DATABASE_UNKNOWN_ERROR';
    message = 'An unknown database error occurred';
  } else if (error instanceof PrismaClientRustPanicError) {
    // Prisma panic errors
    statusCode = 500;
    code = 'DATABASE_PANIC_ERROR';
    message = 'Database engine panic occurred';
  } else if (error instanceof PrismaClientInitializationError) {
    // Prisma initialization errors
    statusCode = 500;
    code = 'DATABASE_INIT_ERROR';
    message = 'Database initialization failed';
  } else if (error instanceof PrismaClientValidationError) {
    // Prisma validation errors
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data provided';
  } else if (error.name === 'ValidationError') {
    // Validation errors (from express-validator or similar)
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    // JWT expired errors
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    // JSON parsing errors
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (error.name === 'MulterError') {
    // File upload errors
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = error.message;
  }

  // Prepare error response
  const errorResponse: ApiError = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = {
      ...(errorResponse.error.details || {}),
      stack: error.stack
    };
  }

  res.status(statusCode).json(errorResponse);
};

// Helper function to create common errors
export const createError = {
  notFound: (message = 'Resource not found') => 
    new AppError(message, 404, 'NOT_FOUND'),
  
  unauthorized: (message = 'Authentication required') => 
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message = 'Access denied') => 
    new AppError(message, 403, 'FORBIDDEN'),
  
  badRequest: (message = 'Invalid request') => 
    new AppError(message, 400, 'BAD_REQUEST'),
  
  conflict: (message = 'Resource conflict') => 
    new AppError(message, 409, 'CONFLICT'),
  
  tooManyRequests: (message = 'Too many requests') => 
    new AppError(message, 429, 'TOO_MANY_REQUESTS'),
  
  internalServer: (message = 'Internal server error') => 
    new AppError(message, 500, 'INTERNAL_SERVER_ERROR')
};