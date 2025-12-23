import { PrismaClient } from '@prisma/client';

// Create Prisma Client for PostgreSQL with connection pool configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle connection errors
prisma.$on('error' as never, (e: any) => {
  console.error('[Prisma] Database error:', e);
  // Prisma will automatically retry on next query
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Test connection on startup
async function testConnection() {
  try {
    await prisma.$connect();
    if (process.env.NODE_ENV !== 'test') {
      console.log('✅ Connected to PostgreSQL database');
    }
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    // Don't throw - let the app start and retry on first query
  }
}

testConnection();

export default prisma;


