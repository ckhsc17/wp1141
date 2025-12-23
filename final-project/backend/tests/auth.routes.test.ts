import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/lib/prisma';

describe('Auth Routes Integration', () => {
  beforeAll(async () => {
    // Clean test database
    await prisma.user.deleteMany({});
  });

  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 409 for duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('USER_EXISTS');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: 'password123' });
      
      expect(res.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'new@example.com', password: 'short' });
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully and set HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
      
      const cookieHeader = res.headers['set-cookie'][0];
      expect(cookieHeader).toContain('token=');
      expect(cookieHeader).toContain('HttpOnly');
      expect(cookieHeader).toContain('SameSite=Lax');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpass' });
      
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });
      
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /auth/me', () => {
    let agent: any;

    beforeAll(async () => {
      agent = request.agent(app);
      await agent.post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
    });

    it('should return user data when authenticated', async () => {
      const res = await agent.get('/auth/me');
      
      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/auth/me');
      
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookie and logout', async () => {
      const agent = request.agent(app);
      
      // Login first
      await agent.post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      // Logout
      const res = await agent.post('/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logout successful');
      
      // Verify cannot access /auth/me after logout
      const meRes = await agent.get('/auth/me');
      expect(meRes.status).toBe(401);
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });
});

