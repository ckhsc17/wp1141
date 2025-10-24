import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../types';

const userService = new UserService();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
export const getCurrentUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const result = await userService.getUserProfile(userId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error,
        message: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get current user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export const getCurrentUserStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const result = await userService.getUserStats(userId);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'User statistics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/treasures:
 *   get:
 *     summary: Get current user's treasures
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User treasures retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export const getCurrentUserTreasures = async (
  req: AuthenticatedRequest,  
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // 最大限制100

    const result = await userService.getUserTreasures(userId, userId, page, limit);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'User treasures retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/favorites:
 *   get:
 *     summary: Get current user's favorite treasures
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User favorites retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export const getCurrentUserFavorites = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await userService.getUserFavorites(userId, userId, page, limit);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'User favorites retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User name
 *               avatar:
 *                 type: string
 *                 description: Avatar URL
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
export const updateCurrentUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { name, avatar } = req.body;

    // 基本驗證
    if (!name && !avatar) {
      res.status(400).json({
        success: false,
        error: 'At least one field (name or avatar) is required'
      });
      return;
    }

    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: 'Name must be a non-empty string'
      });
      return;
    }

    if (avatar && typeof avatar !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Avatar must be a string'
      });
      return;
    }

    const updateData: { name?: string; avatar?: string } = {};
    if (name) updateData.name = name.trim();
    if (avatar) updateData.avatar = avatar;

    const result = await userService.updateUserProfile(userId, updateData);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'User profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{userId}/profile:
 *   get:
 *     summary: Get public user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public user profile retrieved successfully
 *       404:
 *         description: User not found
 */
export const getPublicUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    const result = await userService.getUserProfile(userId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error,
        message: result.error
      });
      return;
    }

    // 返回公開資訊（隱藏敏感資訊如 email）
    const publicProfile = {
      id: result.data!.id,
      name: result.data!.name,
      avatar: result.data!.avatar
    };

    res.json({
      success: true,
      data: publicProfile,
      message: 'Public user profile retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{userId}/treasures:
 *   get:
 *     summary: Get public user treasures by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Public user treasures retrieved successfully
 *       404:
 *         description: User not found
 */
export const getPublicUserTreasures = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id || '';

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await userService.getUserTreasures(userId, requestingUserId, page, limit);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error,
        message: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Public user treasures retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/collects:
 *   get:
 *     summary: Get current user's collected treasures
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User collects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         collects:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/CollectDTO'
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
export const getUserCollects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await userService.getUserCollects(userId, page, limit);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error,
        message: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: 'User collects retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};