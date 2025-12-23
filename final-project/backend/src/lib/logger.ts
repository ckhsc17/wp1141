/**
 * Logger utility for conditional logging based on environment
 * 
 * Usage:
 * - Development: All logs are shown
 * - Production: Only errors and warnings are shown (unless DEBUG=true)
 * - Set DEBUG=true to enable verbose logging in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebug = process.env.DEBUG === 'true';

export const logger = {
  /**
   * Log info messages (only in development or when DEBUG=true)
   */
  info: (...args: any[]) => {
    if (isDevelopment || isDebug) {
      console.log(...args);
    }
  },

  /**
   * Log debug messages (only in development or when DEBUG=true)
   */
  debug: (...args: any[]) => {
    if (isDevelopment || isDebug) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log warnings (always shown, but can be filtered in production)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Log errors (always shown)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },
};

