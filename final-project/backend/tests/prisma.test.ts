import { describe, it, expect } from 'vitest';
import { prisma } from './setup';

describe('Prisma Client', () => {
  it('should connect to database', async () => {
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    expect(result).toBeDefined();
  });

  it('should have User model available', () => {
    expect(prisma.user).toBeDefined();
    expect(typeof prisma.user.findMany).toBe('function');
  });

  it('should have Group model available', () => {
    expect(prisma.group).toBeDefined();
    expect(typeof prisma.group.findMany).toBe('function');
  });

  it('should have Member model available', () => {
    expect(prisma.member).toBeDefined();
    expect(typeof prisma.member.findMany).toBe('function');
  });
});


