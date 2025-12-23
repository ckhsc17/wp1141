import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { signToken, verifyToken } from '../src/utils/jwt';

describe('Authentication Utils', () => {
  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'testpassword123';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify hashed password correctly', async () => {
      const password = 'testpassword123';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    it('should sign and verify JWT token', () => {
      const userId = 123;
      const token = signToken(userId);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      const payload = verifyToken(token);
      expect(payload.userId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid-token');
      }).toThrow();
    });

    it('should include userId in payload', () => {
      const userId = 456;
      const token = signToken(userId);
      const payload = verifyToken(token);
      
      expect(payload).toHaveProperty('userId', userId);
      expect(payload).toHaveProperty('iat'); // issued at
      expect(payload).toHaveProperty('exp'); // expiration
    });
  });
});


