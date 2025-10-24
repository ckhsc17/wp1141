import { Response, NextFunction } from 'express';
import { TreasureService } from '../services/treasureService';
import { 
  AuthenticatedRequest,
  CreateTreasureDTO,
  UpdateTreasureDTO,
  TreasureDTO,
  TreasureDetailDTO,
  TreasureQuery,
  TreasureType,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  UserDTO
} from '../types';
import { createError } from '../middleware/errorHandler';

const treasureService = new TreasureService();



/**
 * @swagger
 * /api/treasures:
 *   get:
 *     summary: Get treasures with optional filtering
 *     tags: [Treasures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           format: double
 *         description: Center latitude for location-based search
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           format: double
 *         description: Center longitude for location-based search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           format: double
 *         description: Search radius in kilometers
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/TreasureType'
 *         description: Filter by treasure type
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search treasures by title, content, or tags
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           pattern: "^c[a-z0-9]{24,}$"
 *         description: Filter by user ID
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Treasures retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Treasure'
 */
export const getTreasures = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radius,
      type,
      tags,
      userId,
      search,
      page = 1,
      limit = 20
    }: TreasureQuery = req.query as any;

    const currentUserId = req.user?.id;

    const result = await treasureService.getTreasures(
      {
        latitude: latitude ? parseFloat(String(latitude)) : undefined,
        longitude: longitude ? parseFloat(String(longitude)) : undefined,
        radius: radius ? parseFloat(String(radius)) : undefined,
        type: type as TreasureType | undefined,
        tags: Array.isArray(tags) ? tags : tags ? [tags] : undefined,
        userId: userId as string,
        search: search as string,
        page: parseInt(String(page)) || 1,
        limit: Math.min(parseInt(String(limit)) || 20, 100)
      },
      currentUserId
    );


    if (!result.success || !result.data) {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to get treasures'
      });
      return;
    }

    const response: PaginatedResponse<TreasureDTO> = {
      success: true,
      data: result.data!.treasures,
      pagination: {
        page: parseInt(String(page)) || 1,
        limit: Math.min(parseInt(String(limit)) || 20, 100),
        total: result.data!.total,
        totalPages: result.data!.totalPages
      }
    };

    res.json(response);
    return;
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @swagger
 * /api/treasures/{id}:
 *   get:
 *     summary: Get treasure by ID
 *     tags: [Treasures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^c[a-z0-9]{24,}$"
 *         description: Treasure ID
 *     responses:
 *       200:
 *         description: Treasure retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Treasure'
 *       404:
 *         description: Treasure not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const getTreasureById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const result = await treasureService.getTreasureById(id, currentUserId);

    if (!result.success || !result.data) {
      res.status(404).json({
        success: false,
        message: result.error || 'Treasure not found'
      });
      return;
    }

    const response: ApiResponse<TreasureDetailDTO> = {
      success: true,
      data: result.data,
      message: 'Treasure retrieved successfully'
    };

    res.json(response);
      return;
  } catch (error) {
    next(error);
      return;
  }
};

/**
 * @swagger
 * /api/treasures:
 *   post:
 *     summary: Create a new treasure
 *     tags: [Treasures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTreasure'
 *     responses:
 *       201:
 *         description: Treasure created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Treasure'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const createTreasure = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw createError.unauthorized('User not authenticated');
      return;
    }

    const treasureData: CreateTreasureDTO = req.body;

    const result = await treasureService.createTreasure(treasureData, userId);

    if (!result.success || !result.data) {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to create treasure'
      });
      return;
    }

    const response: ApiResponse<TreasureDTO> = {
      success: true,
      data: result.data!,
      message: 'Treasure created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/treasures/{id}:
 *   put:
 *     summary: Update treasure
 *     tags: [Treasures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^c[a-z0-9]{24,}$"
 *         description: Treasure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTreasure'
 *     responses:
 *       200:
 *         description: Treasure updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Treasure'
 *       403:
 *         description: Not authorized to update this treasure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Treasure not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const updateTreasure = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData: UpdateTreasureDTO = req.body;

    if (!userId) {
      throw createError.unauthorized('User not authenticated');
      return;
    }

    const result = await treasureService.updateTreasure(id, updateData, userId);

    if (!result.success) {
      if (result.error === 'Treasure not found') {
        res.status(404).json({
          success: false,
          message: result.error
        });
      return;
      }
      if (result.error === 'Not authorized to update this treasure') {
        res.status(403).json({
          success: false,
          message: result.error
        });
      return;
      }
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to update treasure'
      });
      return;
    }

    const response: ApiResponse<TreasureDTO> = {
      success: true,
      data: result.data!,
      message: 'Treasure updated successfully'
    };

    res.json(response);
      return;
  } catch (error) {
    next(error);
      return;
  }
};

/**
 * @swagger
 * /api/treasures/{id}:
 *   delete:
 *     summary: Delete treasure
 *     tags: [Treasures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^c[a-z0-9]{24,}$"
 *         description: Treasure ID
 *     responses:
 *       200:
 *         description: Treasure deleted successfully
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
 *                         message:
 *                           type: string
 *       403:
 *         description: Not authorized to delete this treasure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Treasure not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const deleteTreasure = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw createError.unauthorized('User not authenticated');
      return;
    }

    const result = await treasureService.deleteTreasure(id, userId);

    if (!result.success) {
      if (result.error === 'Treasure not found') {
        res.status(404).json({
          success: false,
          message: result.error
        });
      return;
      }
      if (result.error === 'Not authorized to delete this treasure') {
        res.status(403).json({
          success: false,
          message: result.error
        });
      return;
      }
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to delete treasure'
      });
      return;
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Treasure deleted successfully'
      }
    };

    res.json(response);
      return;
  } catch (error) {
    next(error);
      return;
  }
};

/**
 * @swagger
 * /api/treasures/{id}/like:
 *   post:
 *     summary: Toggle like for treasure
 *     tags: [Treasures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^c[a-z0-9]{24,}$"
 *         description: Treasure ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
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
 *                         isLiked:
 *                           type: boolean
 *                         likesCount:
 *                           type: integer
 *       404:
 *         description: Treasure not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const toggleLike = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await treasureService.toggleLike(id, userId);

    if (!result.success) {
      if (result.error === 'Treasure not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'TREASURE_NOT_FOUND',
            message: '寶藏不存在'
          }
        });
      return;
      }
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to toggle like'
      });
      return;
    }

    const response = {
      success: true,
      data: result.data,
      message: result.data?.isLiked ? '已按讚' : '取消按讚'
    };

    res.json(response);
      return;
  } catch (error) {
    next(error);
      return;
  }
};


/**
 * @swagger
 * /api/treasures/{id}/favorite:
 *   post:
 *     summary: Toggle favorite for treasure
 *     tags: [Treasures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^c[a-z0-9]{24,}$"
 *         description: Treasure ID
 *     responses:
 *       200:
 *         description: Favorite toggled successfully
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
 *                         isFavorited:
 *                           type: boolean
 *       404:
 *         description: Treasure not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const toggleFavorite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await treasureService.toggleFavorite(id, userId);

    if (!result.success) {
      if (result.error === 'Treasure not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'TREASURE_NOT_FOUND',
            message: '寶藏不存在'
          }
        });
      return;
      }
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to toggle favorite'
      });
      return;
    }

    const response = {
      success: true,
      data: result.data,
      message: result.data?.isFavorited ? '已收藏' : '取消收藏'
    };

    res.json(response);
      return;
  } catch (error) {
    next(error);
      return;
  }
};

/**
 * @swagger
 * /api/treasures/collect:
 *   post:
 *     summary: Collect a treasure
 *     tags: [Treasures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - treasureId
 *             properties:
 *               treasureId:
 *                 type: string
 *                 description: ID of the treasure to collect
 *     responses:
 *       200:
 *         description: Treasure collected successfully
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
 *                         isCollected:
 *                           type: boolean
 *       400:
 *         description: Treasure cannot be collected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Treasure not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const collectTreasure = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { treasureId } = req.body;
    const userId = req.user!.id;

    if (!treasureId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TREASURE_ID',
          message: '缺少寶藏 ID'
        }
      });
      return;
    }

    const result = await treasureService.collectTreasure(treasureId, userId);

    if (!result.success) {
      if (result.error === 'Treasure not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'TREASURE_NOT_FOUND',
            message: '寶藏不存在'
          }
        });
        return;
      }
      if (result.error === 'This treasure cannot be collected') {
        res.status(400).json({
          success: false,
          error: {
            code: 'TREASURE_NOT_COLLECTABLE',
            message: '此寶藏無法收集'
          }
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to collect treasure'
      });
      return;
    }

    const response = {
      success: true,
      data: result.data,
      message: result.data?.isCollected ? '寶藏已收集' : '取消收集寶藏'
    };

    res.json(response);
    return;
  } catch (error) {
    next(error);
    return;
  }
};