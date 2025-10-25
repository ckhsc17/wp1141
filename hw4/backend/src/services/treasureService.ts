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
      isCollected: currentUserId ? 
        treasure.collects?.some((collect: any) => collect.userId === currentUserId) || false : false,
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
        search,
        page = 1,
        limit = 20
      } = query;

      const pageNum = parseInt(String(page)) || 1;
      const limitNum = Math.min(parseInt(String(limit)) || 20, 100);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        deletedAt: null // Only get non-deleted treasures
      };

      // If querying specific user's treasures and it's the same user, show all their treasures
      if (userId && userId === currentUserId) {
        // User can see all their own treasures (including hidden/private ones)
        where.userId = userId;
      } else {
        // For public queries or other users' treasures, only show public ones
        where.OR = [
          { isPublic: true },    // Public life moments
          { isHidden: false }    // Public treasures
        ];
        
        if (userId) {
          where.userId = userId;
        }
      }

      if (type) {
        where.type = type;
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        where.tags = {
          hasSome: tagArray
        };
      }

      // Add search functionality
      if (search) {
        where.OR = [
          ...(where.OR || []),
          {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            tags: {
              hasSome: [search]
            }
          }
        ];
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
            },
            collects: {
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
      // First, get the treasure to check ownership
      const treasureCheck = await prisma.treasure.findUnique({
        where: { 
          id: treasureId,
          deletedAt: null
        },
        select: { userId: true }
      });

      if (!treasureCheck) {
        return {
          success: false,
          error: 'Treasure not found'
        };
      }

      // Build where clause based on ownership and visibility
      const whereClause: any = { 
        id: treasureId,
        deletedAt: null
      };

      // If not the owner, add visibility restrictions
      if (treasureCheck.userId !== currentUserId) {
        whereClause.OR = [
          { isPublic: true },    // Public life moments
          { isHidden: false }    // Public treasures
        ];
      }

      const treasure = await prisma.treasure.findFirst({
        where: whereClause,
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
            },
            collects: {
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
      // Debug: Log received data
      console.log('=== createTreasure Debug ===');
      console.log('Received treasureData:', JSON.stringify(treasureData, null, 2));
      console.log('userId:', userId);
      console.log('mediaUrl in treasureData:', treasureData.mediaUrl);
      console.log('============================');

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

      console.log('createData before Prisma create:', JSON.stringify(createData, null, 2));

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
        where: { 
          id: treasureId,
          deletedAt: null // Only get non-deleted treasures
        },
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
          },
          collects: {
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
        where: { 
          id: treasureId,
          deletedAt: null // Only get non-deleted treasures
        },
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

      // Soft delete treasure by setting deletedAt timestamp
      await prisma.treasure.update({
        where: { id: treasureId },
        data: {
          deletedAt: new Date()
        }
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
        where: { 
          id: treasureId,
          deletedAt: null // Only get non-deleted treasures
        },
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
        where: { 
          id: treasureId,
          deletedAt: null // Only get non-deleted treasures
        },
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

  /**
   * Collect a treasure
   */
  async collectTreasure(
    treasureId: string, 
    userId: string
  ): Promise<ServiceResult<{ isCollected: boolean }>> {
    try {
      // Check if treasure exists and is collectable (isHidden !== null)
      const treasure = await prisma.treasure.findUnique({
        where: { 
          id: treasureId,
          deletedAt: null // Only get non-deleted treasures
        },
        select: { 
          id: true,
          isHidden: true
        }
      });

      if (!treasure) {
        return {
          success: false,
          error: 'Treasure not found'
        };
      }

      if (treasure.isHidden === null) {
        return {
          success: false,
          error: 'This treasure cannot be collected'
        };
      }

      // Check if already collected
      const existingCollect = await prisma.collect.findUnique({
        where: {
          userId_treasureId: {
            userId,
            treasureId
          }
        }
      });

      if (existingCollect) {
        // Remove collect
        await prisma.collect.delete({
          where: {
            userId_treasureId: {
              userId,
              treasureId
            }
          }
        });

        return {
          success: true,
          data: { isCollected: false }
        };
      } else {
        // Add collect
        await prisma.collect.create({
          data: {
            userId,
            treasureId,
            isLocked: false // Default to unlocked when collected
          }
        });

        return {
          success: true,
          data: { isCollected: true }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to collect treasure'
      };
    }
  }
}