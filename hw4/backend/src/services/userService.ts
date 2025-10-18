import { PrismaClient } from '../generated/prisma';
import {
  UserDTO,
  TreasureDTO,
  ServiceResult,
  TreasureType
} from '../types';

const prisma = new PrismaClient();

interface UserStats {
  uploadedTreasures: number;
  favoritedTreasures: number;
  totalLikes: number;
  totalComments: number;
}

export class UserService {
  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<ServiceResult<UserDTO>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const userDTO: UserDTO = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      };

      return {
        success: true,
        data: userDTO
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: 'Failed to get user profile'
      };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<ServiceResult<UserStats>> {
    try {
      // 並行查詢所有統計數據
      const [uploadedTreasures, favoritedTreasures, totalLikes, totalComments] = await Promise.all([
        // 上傳的寶藏數量
        prisma.treasure.count({
          where: {
            userId,
            deletedAt: null
          }
        }),
        
        // 收藏的寶藏數量
        prisma.favorite.count({
          where: { userId }
        }),
        
        // 獲得的總讚數（自己的寶藏被按讚的數量）
        prisma.like.count({
          where: {
            treasure: {
              userId,
              deletedAt: null
            }
          }
        }),
        
        // 發表的留言數量
        prisma.comment.count({
          where: {
            userId,
            deletedAt: null
          }
        })
      ]);

      const stats: UserStats = {
        uploadedTreasures,
        favoritedTreasures,
        totalLikes,
        totalComments
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        success: false,
        error: 'Failed to get user statistics'
      };
    }
  }

  /**
   * Get user's treasures
   */
  async getUserTreasures(
    userId: string,
    requestingUserId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResult<{ treasures: TreasureDTO[]; total: number; totalPages: number }>> {
    try {
      const skip = (page - 1) * limit;
      
      // 檢查權限：只有本人可以看到自己的所有寶藏
      const isOwner = userId === requestingUserId;
      
      const whereClause = {
        userId,
        deletedAt: null,
        // 如果不是本人，可以在這裡添加公開性檢查
        // ...(isOwner ? {} : { isPublic: true })
      };

      const [treasures, total] = await Promise.all([
        prisma.treasure.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: {
                  where: { deletedAt: null }
                }
              }
            },
            // 檢查當前用戶是否已按讚和收藏
            likes: requestingUserId ? {
              where: { userId: requestingUserId },
              select: { id: true }
            } : false,
            favorites: requestingUserId ? {
              where: { userId: requestingUserId },
              select: { id: true }
            } : false
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        
        prisma.treasure.count({ where: whereClause })
      ]);

      const treasureDTOs: TreasureDTO[] = treasures.map(treasure => ({
        id: treasure.id,
        title: treasure.title,
        content: treasure.content,
        type: treasure.type as TreasureType,
        latitude: treasure.latitude,
        longitude: treasure.longitude,
        address: treasure.address || undefined,
        mediaUrl: treasure.mediaUrl || undefined,
        linkUrl: treasure.linkUrl || undefined,
        isLiveLocation: treasure.isLiveLocation,
        tags: treasure.tags,
        likesCount: treasure._count.likes,
        commentsCount: treasure._count.comments,
        isLiked: treasure.likes.length > 0,
        isFavorited: treasure.favorites.length > 0,
        createdAt: treasure.createdAt.toISOString(),
        user: treasure.user
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          treasures: treasureDTOs,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error('Get user treasures error:', error);
      return {
        success: false,
        error: 'Failed to get user treasures'
      };
    }
  }

  /**
   * Get user's favorite treasures
   */
  async getUserFavorites(
    userId: string,
    requestingUserId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResult<{ favorites: TreasureDTO[]; total: number; totalPages: number }>> {
    try {
      // 只有本人可以查看自己的收藏
      if (userId !== requestingUserId) {
        return {
          success: false,
          error: 'Access denied: Can only view your own favorites'
        };
      }

      const skip = (page - 1) * limit;

      const [favorites, total] = await Promise.all([
        prisma.favorite.findMany({
          where: { userId },
          include: {
            treasure: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                  }
                },
                _count: {
                  select: {
                    likes: true,
                    comments: {
                      where: { deletedAt: null }
                    }
                  }
                },
                likes: {
                  where: { userId: requestingUserId },
                  select: { id: true }
                },
                favorites: {
                  where: { userId: requestingUserId },
                  select: { id: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        
        prisma.favorite.count({ where: { userId } })
      ]);

      const treasureDTOs: TreasureDTO[] = favorites
        .filter(favorite => favorite.treasure.deletedAt === null) // 過濾已刪除的寶藏
        .map(favorite => ({
          id: favorite.treasure.id,
          title: favorite.treasure.title,
          content: favorite.treasure.content,
          type: favorite.treasure.type as TreasureType,
          latitude: favorite.treasure.latitude,
          longitude: favorite.treasure.longitude,
          address: favorite.treasure.address || undefined,
          mediaUrl: favorite.treasure.mediaUrl || undefined,
          linkUrl: favorite.treasure.linkUrl || undefined,
          isLiveLocation: favorite.treasure.isLiveLocation,
          tags: favorite.treasure.tags,
          likesCount: favorite.treasure._count.likes,
          commentsCount: favorite.treasure._count.comments,
          isLiked: favorite.treasure.likes.length > 0,
          isFavorited: favorite.treasure.favorites.length > 0,
          createdAt: favorite.treasure.createdAt.toISOString(),
          user: favorite.treasure.user
        }));

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          favorites: treasureDTOs,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error('Get user favorites error:', error);
      return {
        success: false,
        error: 'Failed to get user favorites'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updateData: { name?: string; avatar?: string }
  ): Promise<ServiceResult<UserDTO>> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true
        }
      });

      const userDTO: UserDTO = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      };

      return {
        success: true,
        data: userDTO
      };
    } catch (error) {
      console.error('Update user profile error:', error);
      return {
        success: false,
        error: 'Failed to update user profile'
      };
    }
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      return !!user;
    } catch (error) {
      return false;
    }
  }
}