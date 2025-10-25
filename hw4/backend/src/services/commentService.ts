import { PrismaClient } from '@prisma/client';
import {
  CreateCommentDTO,
  CommentDTO,
  ServiceResult
} from '../types';

const prisma = new PrismaClient();

export class CommentService {
  /**
   * Create a new comment
   */
  async createComment(
    treasureId: string,
    commentData: CreateCommentDTO,
    userId: string
  ): Promise<ServiceResult<CommentDTO>> {
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

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          content: commentData.content,
          userId,
          treasureId
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Update comments count
      await prisma.treasure.update({
        where: { id: treasureId },
        data: {
          commentsCount: {
            increment: 1
          }
        }
      });

      const commentDTO: CommentDTO = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user
      };

      return {
        success: true,
        data: commentDTO
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create comment'
      };
    }
  }

  /**
   * Update comment
   */
  async updateComment(
    commentId: string,
    content: string,
    userId: string
  ): Promise<ServiceResult<CommentDTO>> {
    try {
      // Check if comment exists and belongs to user
      const existingComment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true, treasureId: true }
      });

      if (!existingComment) {
        return {
          success: false,
          error: 'Comment not found'
        };
      }

      if (existingComment.userId !== userId) {
        return {
          success: false,
          error: 'Not authorized to update this comment'
        };
      }

      // Update comment
      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content,
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
          }
        }
      });

      const commentDTO: CommentDTO = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user
      };

      return {
        success: true,
        data: commentDTO
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update comment'
      };
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      // Check if comment exists and belongs to user
      const existingComment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true, treasureId: true }
      });

      if (!existingComment) {
        return {
          success: false,
          error: 'Comment not found'
        };
      }

      if (existingComment.userId !== userId) {
        return {
          success: false,
          error: 'Not authorized to delete this comment'
        };
      }

      // Delete comment
      await prisma.comment.delete({
        where: { id: commentId }
      });

      // Update comments count
      await prisma.treasure.update({
        where: { id: existingComment.treasureId },
        data: {
          commentsCount: {
            decrement: 1
          }
        }
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete comment'
      };
    }
  }

  /**
   * Get comments for a treasure
   */
  async getCommentsByTreasureId(
    treasureId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResult<{ comments: CommentDTO[]; total: number; totalPages: number }>> {
    try {
      const pageNum = Math.max(1, page);
      const limitNum = Math.min(Math.max(1, limit), 100);
      const offset = (pageNum - 1) * limitNum;

      // Get comments with pagination
      const comments = await prisma.comment.findMany({
        where: { treasureId },
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
        },
        skip: offset,
        take: limitNum
      });

      // Get total count
      const total = await prisma.comment.count({
        where: { treasureId }
      });

      const totalPages = Math.ceil(total / limitNum);

      const commentDTOs: CommentDTO[] = comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user
      }));

      return {
        success: true,
        data: {
          comments: commentDTOs,
          total,
          totalPages
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get comments'
      };
    }
  }

  /**
   * Get comment by ID
   */
  async getCommentById(commentId: string): Promise<ServiceResult<CommentDTO>> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      if (!comment) {
        return {
          success: false,
          error: 'Comment not found'
        };
      }

      const commentDTO: CommentDTO = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user
      };

      return {
        success: true,
        data: commentDTO
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get comment'
      };
    }
  }
}