import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  AuthenticatedRequest,
  CreateTreasureDTO,
  UpdateTreasureDTO,
  TreasureDTO,
  TreasureDetailDTO,
  TreasureQuery,
  ApiResponse,
  PaginatedResponse,
  UserDTO
} from '../types';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// Helper function to calculate distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to transform treasure data
const transformTreasure = (
  treasure: any,
  currentUserId?: string
): TreasureDTO => {
  return {
    id: treasure.id,
    title: treasure.title,
    content: treasure.content,
    type: treasure.type,
    latitude: treasure.latitude,
    longitude: treasure.longitude,
    address: treasure.address,
    mediaUrl: treasure.mediaUrl,
    linkUrl: treasure.linkUrl,
    isLiveLocation: treasure.isLiveLocation,
    tags: treasure.tags,
    likesCount: treasure._count?.likes || 0,
    commentsCount: treasure._count?.comments || 0,
    isLiked: currentUserId ? treasure.likes?.some((like: any) => like.userId === currentUserId) || false : false,
    isFavorited: currentUserId ? treasure.favorites?.some((fav: any) => fav.userId === currentUserId) || false : false,
    createdAt: treasure.createdAt.toISOString(),
    user: {
      id: treasure.user.id,
      email: treasure.user.email,
      name: treasure.user.name,
      avatar: treasure.user.avatar
    }
  };
};

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
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
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
      page = 1,
      limit = 20
    }: TreasureQuery = req.query as any;

    const currentUserId = req.user?.id;
    const pageNum = parseInt(String(page)) || 1;
    const limitNum = Math.min(parseInt(String(limit)) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        hasSome: tagArray
      };
    }

    // Get treasures with counts and user info
    const treasures = await prisma.treasure.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { userId: true }
          },
          favorites: {
            where: { userId: currentUserId },
            select: { userId: true }
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limitNum
    });

    // Filter by location if coordinates provided
    let filteredTreasures = treasures;
    if (latitude && longitude) {
      const searchRadius = radius || 10; // Default 10km radius
      
      filteredTreasures = treasures.filter((treasure: any) => {
        const distance = calculateDistance(
          parseFloat(String(latitude)),
          parseFloat(String(longitude)),
          treasure.latitude,
          treasure.longitude
        );
        return distance <= searchRadius;
      });
    }

    // Get total count for pagination
    const total = await prisma.treasure.count({ where });
    const totalPages = Math.ceil(total / limitNum);

    // Transform treasures
    const transformedTreasures = filteredTreasures.map((treasure: any) => 
      transformTreasure(treasure, currentUserId)
    );

    const response: PaginatedResponse<TreasureDTO> = {
      success: true,
      data: transformedTreasures,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
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
 *           format: uuid
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

    const treasure = await prisma.treasure.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { userId: true }
          },
          favorites: {
            where: { userId: currentUserId },
            select: { userId: true }
          }
        })
      }
    });

    if (!treasure) {
      throw createError.notFound('Treasure not found');
    }

    // Transform treasure with comments
    const transformedTreasure: TreasureDetailDTO = {
      ...transformTreasure(treasure, currentUserId),
      comments: treasure.comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user
      }))
    };

    const response: ApiResponse<TreasureDetailDTO> = {
      success: true,
      data: transformedTreasure,
      message: 'Treasure retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
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
    }

    const treasureData: CreateTreasureDTO = req.body;

    // Calculate location radius for live location treasures
    const locationRadius = treasureData.isLiveLocation ? 0.05 : 0; // 50m for live location

    const treasure = await prisma.treasure.create({
      data: {
        ...treasureData,
        userId,
        locationRadius,
        likesCount: 0,
        commentsCount: 0
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    const transformedTreasure = transformTreasure(treasure, userId);

    const response: ApiResponse<TreasureDTO> = {
      success: true,
      data: transformedTreasure,
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
 *           format: uuid
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
    }

    // Check if treasure exists and belongs to user
    const existingTreasure = await prisma.treasure.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!existingTreasure) {
      throw createError.notFound('Treasure not found');
    }

    if (existingTreasure.userId !== userId) {
      throw createError.forbidden('Not authorized to update this treasure');
    }

    // Update treasure
    const treasure = await prisma.treasure.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: {
          where: { userId },
          select: { userId: true }
        },
        favorites: {
          where: { userId },
          select: { userId: true }
        }
      }
    });

    const transformedTreasure = transformTreasure(treasure, userId);

    const response: ApiResponse<TreasureDTO> = {
      success: true,
      data: transformedTreasure,
      message: 'Treasure updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
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
 *           format: uuid
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
    }

    // Check if treasure exists and belongs to user
    const existingTreasure = await prisma.treasure.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!existingTreasure) {
      throw createError.notFound('Treasure not found');
    }

    if (existingTreasure.userId !== userId) {
      throw createError.forbidden('Not authorized to delete this treasure');
    }

    // Delete treasure (cascade will handle related records)
    await prisma.treasure.delete({
      where: { id }
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Treasure deleted successfully'
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};