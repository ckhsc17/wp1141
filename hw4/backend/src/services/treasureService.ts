import { PrismaClient } from '../generated/prisma';
import {
  CreateTreasureDTO,
  UpdateTreasureDTO,
  TreasureDTO,
  TreasureDetailDTO,
  TreasureQuery,
  ServiceResult,
  UserDTO
} from '../types';
import { calculateDistance } from '../utils/locationUtils';

const prisma = new PrismaClient();

export class TreasureService {
  /**
   * Transform treasure database result to DTO
   */
  private transformTreasure(treasure: any, currentUserId?: string): TreasureDTO {
    return {
      id: treasure.id,
      title: treasure.title,
      content: treasure.content,
      type: treasure.type,
      latitude: treasure.latitude,
      longitude: treasure.longitude,
      address: treasure.address,
      amount: treasure.amount,
      isPublic: treasure.isPublic,
      isHidden: treasure.isHidden,
      mediaUrl: treasure.mediaUrl,
      linkUrl: treasure.linkUrl,
      isLiveLocation: treasure.isLiveLocation,
      tags: treasure.tags,
      likesCount: treasure._count?.likes || 0,
      commentsCount: treasure._count?.comments || 0,
      isLiked: currentUserId ? 
        treasure.likes?.some((like: any) => like.userId === currentUserId) || false : false,
      isFavorited: currentUserId ? 
        treasure.favorites?.some((fav: any) => fav.userId === currentUserId) || false : false,
      createdAt: treasure.createdAt.toISOString(),
      user: {
        id: treasure.user.id,
        email: treasure.user.email,
        name: treasure.user.name,
        avatar: treasure.user.avatar
      }
    };
  }

  /**
   * Get treasures with filtering and pagination
   */
  async getTreasures(
    query: TreasureQuery,
    currentUserId?: string
  ): Promise<ServiceResult<{ treasures: TreasureDTO[]; total: number; totalPages: number }>> {
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
      } = query;

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

      // Get treasures with relations
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
        this.transformTreasure(treasure, currentUserId)
      );

      return {
        success: true,
        data: {
          treasures: transformedTreasures,
          total,
          totalPages
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get treasures'
      };
    }
  }

  /**
   * Get treasure by ID with details
   */
  async getTreasureById(
    treasureId: string,
    currentUserId?: string
  ): Promise<ServiceResult<TreasureDetailDTO>> {
    try {
      const treasure = await prisma.treasure.findUnique({
        where: { id: treasureId },
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
        return {
          success: false,
          error: 'Treasure not found'
        };
      }

      // Transform treasure with comments
      const transformedTreasure: TreasureDetailDTO = {
        ...this.transformTreasure(treasure, currentUserId),
        comments: treasure.comments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          user: comment.user
        }))
      };

      return {
        success: true,
        data: transformedTreasure
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get treasure'
      };
    }
  }

  /**
   * Create new treasure
   */
  async createTreasure(
    treasureData: CreateTreasureDTO,
    userId: string
  ): Promise<ServiceResult<TreasureDTO>> {
    try {
      // Calculate location radius for live location treasures
      const locationRadius = treasureData.isLiveLocation ? 0.05 : 0; // 50m for live location

      // Prepare data with mode-based visibility logic
      const createData = {
        ...treasureData,
        userId,
        locationRadius,
        likesCount: 0,
        commentsCount: 0
      };

      const treasure = await prisma.treasure.create({
        data: createData,
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

      const transformedTreasure = this.transformTreasure(treasure, userId);

      return {
        success: true,
        data: transformedTreasure
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create treasure'
      };
    }
  }

  /**
   * Update treasure
   */
  async updateTreasure(
    treasureId: string,
    updateData: UpdateTreasureDTO,
    userId: string
  ): Promise<ServiceResult<TreasureDTO>> {
    try {
      // Check if treasure exists and belongs to user
      const existingTreasure = await prisma.treasure.findUnique({
        where: { id: treasureId },
        select: { id: true, userId: true }
      });

      if (!existingTreasure) {
        return {
          success: false,
          error: 'Treasure not found'
        };
      }

      if (existingTreasure.userId !== userId) {
        return {
          success: false,
          error: 'Not authorized to update this treasure'
        };
      }

      // Update treasure
      const treasure = await prisma.treasure.update({
        where: { id: treasureId },
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

      const transformedTreasure = this.transformTreasure(treasure, userId);

      return {
        success: true,
        data: transformedTreasure
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update treasure'
      };
    }
  }

  /**
   * Delete treasure
   */
  async deleteTreasure(treasureId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      // Check if treasure exists and belongs to user
      const existingTreasure = await prisma.treasure.findUnique({
        where: { id: treasureId },
        select: { id: true, userId: true }
      });

      if (!existingTreasure) {
        return {
          success: false,
          error: 'Treasure not found'
        };
      }

      if (existingTreasure.userId !== userId) {
        return {
          success: false,
          error: 'Not authorized to delete this treasure'
        };
      }

      // Delete treasure (cascade will handle related records)
      await prisma.treasure.delete({
        where: { id: treasureId }
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete treasure'
      };
    }
  }

  /**
   * Toggle like on treasure
   */
  async toggleLike(treasureId: string, userId: string): Promise<ServiceResult<{ isLiked: boolean; likesCount: number }>> {
    try {
      console.log('Toggling like for treasureId:', treasureId, 'by userId:', userId);
      // Check if treasure exists
      const treasure = await prisma.treasure.findUnique({
        where: { id: treasureId },
        select: { id: true }
      });

      if (!treasure) {
        return {
          success: false,
          error: 'Treasure not found'
        };
      }

      // Check if already liked
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_treasureId: {
            userId,
            treasureId
          }
        }
      });

      if (existingLike) {
        // Remove like
        await prisma.like.delete({
          where: {
            userId_treasureId: {
              userId,
              treasureId
            }
          }
        });

        // Update likes count and get the updated treasure
        const updatedTreasure = await prisma.treasure.update({
          where: { id: treasureId },
          data: {
            likesCount: {
              decrement: 1
            }
          },
          select: { likesCount: true }
        });

        return {
          success: true,
          data: { 
            isLiked: false,
            likesCount: updatedTreasure.likesCount
          }
        };
      } else {
        // Add like
        await prisma.like.create({
          data: {
            userId,
            treasureId
          }
        });

        // Update likes count and get the updated treasure
        const updatedTreasure = await prisma.treasure.update({
          where: { id: treasureId },
          data: {
            likesCount: {
              increment: 1
            }
          },
          select: { likesCount: true }
        });

        return {
          success: true,
          data: { 
            isLiked: true,
            likesCount: updatedTreasure.likesCount
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to toggle like'
      };
    }
  }

  /**
   * Toggle favorite on treasure
   */
  async toggleFavorite(
    treasureId: string, 
    userId: string
  ): Promise<ServiceResult<{ isFavorited: boolean }>> {
    try {
      // Check if treasure exists
      const treasure = await prisma.treasure.findUnique({
        where: { id: treasureId },
        select: { id: true }
      });

      if (!treasure) {
        return {
          success: false,
          error: 'Treasure not found'
        };
      }

      // Check if already favorited
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_treasureId: {
            userId,
            treasureId
          }
        }
      });

      if (existingFavorite) {
        // Remove favorite
        await prisma.favorite.delete({
          where: {
            userId_treasureId: {
              userId,
              treasureId
            }
          }
        });

        return {
          success: true,
          data: { isFavorited: false }
        };
      } else {
        // Add favorite
        await prisma.favorite.create({
          data: {
            userId,
            treasureId
          }
        });

        return {
          success: true,
          data: { isFavorited: true }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to toggle favorite'
      };
    }
  }
}