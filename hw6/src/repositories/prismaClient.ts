import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

// Log DATABASE_URL (masked for security)
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  // Mask password in URL: postgresql://user:password@host:port/db -> postgresql://user:***@host:port/db
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@');
  logger.info('Initializing Prisma Client', {
    databaseUrl: maskedUrl,
    // Extract database name for easier debugging
    databaseName: databaseUrl.match(/\/([^?]+)/)?.[1] || 'unknown',
  });
} else {
  logger.warn('DATABASE_URL is not set in environment variables');
}

export const prisma = new PrismaClient();



