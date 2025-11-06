import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class RepostRepository {
  async create(data: { postId?: string | null; commentId?: string | null; userId: string }) {
    return prisma.repost.create({
      data,
    })
  }

  async delete(postId: string | null, commentId: string | null, userId: string) {
    if (postId) {
      return prisma.repost.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })
    } else if (commentId) {
      return prisma.repost.delete({
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
      return prisma.repost.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })
    } else if (commentId) {
      return prisma.repost.findUnique({
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
    return prisma.repost.count({
      where: { postId },
    })
  }

  async countByComment(commentId: string) {
    return prisma.repost.count({
      where: { commentId },
    })
  }

  async findByUserId(userId: string, options: { skip: number; take: number }) {
    return prisma.repost.findMany({
      where: { userId },
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                userId: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                repostRecords: true,
              },
            },
          },
        },
      },
    })
  }

  async countByUserId(userId: string) {
    return prisma.repost.count({
      where: { userId },
    })
  }
}

export const repostRepository = new RepostRepository()

