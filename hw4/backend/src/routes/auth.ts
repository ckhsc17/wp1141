import { Router } from 'express';
import { 
  login,
  refreshToken,
  getProfile,
  logout,
  googleCallback,
  googleAuth,
  register,
  loginWithPassword
} from '../controllers/authController';
import {
  validateLogin,
  validateRefreshToken
} from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and user management endpoints
 */

// Public routes
router.post('/login', validateLogin, login);
router.post('/register', register);
router.post('/login-password', loginWithPassword);
router.post('/refresh', validateRefreshToken, refreshToken);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;