import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiter for Maps API routes
 * 
 * - Production/Development: 120 requests per minute
 * - Test mode: Disabled (passthrough middleware)
 */
export const mapsRateLimiter = 
  process.env.NODE_ENV === 'test'
    ? // Test mode: passthrough middleware (no rate limiting)
      (req: Request, res: Response, next: NextFunction) => next()
    : // Production/Development: enforce rate limits
      rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 120, // 120 requests per window
        message: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
        standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false,   // Disable `X-RateLimit-*` headers
      });


