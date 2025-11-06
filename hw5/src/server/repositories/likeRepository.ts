import { prisma } from '@/lib/prisma'

export class LikeRepository {
  async create(data: { postId?: string | null; commentId?: string | null; userId: string }) {
    return prisma.like.create({
      data,
    })
  }

  async delete(postId: string | null, commentId: string | null, userId: string) {
    if (postId) {
      return prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })
    } else if (commentId) {
      return prisma.like.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      })
    } else {
      throw new Error('Either postId or commentId must be provided')
    }
  }

  async findUnique(postId: string | null, commentId: string | null, userId: string) {
    if (postId) {
      return prisma.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })
    } else if (commentId) {
      return prisma.like.findUnique({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      })
    } else {
      throw new Error('Either postId or commentId must be provided')
    }
  }

  async countByPost(postId: string) {
    return prisma.like.count({
      where: { postId },
    })
  }

  async countByComment(commentId: string) {
    return prisma.like.count({
      where: { commentId },
    })
  }

  async findByUserId(userId: string, options: { skip: number; take: number }) {
    return prisma.like.findMany({
      where: { userId },
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
    })
  }

  async countByUserId(userId: string) {
    return prisma.like.count({
      where: { userId },
    })
  }
}

export const likeRepository = new LikeRepository()

