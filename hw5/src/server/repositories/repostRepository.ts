import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class RepostRepository {
  async create(data: { postId: string; userId: string }) {
    return prisma.repost.create({
      data,
    })
  }

  async delete(postId: string, userId: string) {
    return prisma.repost.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })
  }

  async findUnique(postId: string, userId: string) {
    return prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })
  }

  async countByPost(postId: string) {
    return prisma.repost.count({
      where: { postId },
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

