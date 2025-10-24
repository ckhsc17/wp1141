import { Router } from 'express';
import {
  getCurrentUserProfile,
  getCurrentUserStats,
  getCurrentUserTreasures,
  getCurrentUserFavorites,
  getUserCollects,
  updateCurrentUserProfile,
  getPublicUserProfile,
  getPublicUserTreasures
} from '../controllers/userController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ==================== 需要認證的路由 ====================

/**
 * 獲取當前用戶檔案
 * GET /api/users/profile
 * 需要 JWT 認證
 */
router.get('/profile', authenticate, getCurrentUserProfile);

/**
 * 更新當前用戶檔案
 * PUT /api/users/profile
 * 需要 JWT 認證
 */
router.put('/profile', authenticate, updateCurrentUserProfile);

/**
 * 獲取當前用戶統計資訊
 * GET /api/users/stats
 * 需要 JWT 認證
 */
router.get('/stats', authenticate, getCurrentUserStats);

/**
 * 獲取當前用戶的寶藏
 * GET /api/users/treasures
 * 需要 JWT 認證
 * Query parameters: page, limit
 */
router.get('/treasures', authenticate, getCurrentUserTreasures);

/**
 * 獲取當前用戶的收藏
 * GET /api/users/favorites
 * 需要 JWT 認證
 * Query parameters: page, limit
 */
router.get('/favorites', authenticate, getCurrentUserFavorites);

/**
 * 獲取當前用戶的收集寶藏
 * GET /api/users/collects
 * 需要 JWT 認證
 * Query parameters: page, limit
 */
router.get('/collects', authenticate, getUserCollects);

// ==================== 公開路由 ====================

/**
 * 獲取公開用戶檔案
 * GET /api/users/:userId/profile
 * 不需要認證，只返回公開資訊
 */
router.get('/:userId/profile', getPublicUserProfile);

/**
 * 獲取公開用戶寶藏
 * GET /api/users/:userId/treasures
 * 可選認證，用於判斷查看權限
 * Query parameters: page, limit
 */
router.get('/:userId/treasures', optionalAuthenticate, getPublicUserTreasures);

export default router;