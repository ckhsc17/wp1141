import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Force test database isolation
// Use a separate test database or in-memory for tests
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://meethalf:meethalf_password@localhost:5432/meethalf_test';
process.env.NODE_ENV = 'test';

// Create test database instance
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

beforeAll(async () => {
  // Setup: Could run migrations or seed data here
  console.log('🔧 Test setup complete');
});

afterAll(async () => {
  // Cleanup: Disconnect from database
  await prisma.$disconnect();
  console.log('🧹 Test cleanup complete');
});

