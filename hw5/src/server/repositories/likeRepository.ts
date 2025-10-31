import { prisma } from '@/lib/prisma'

export class LikeRepository {
  async create(data: { postId: string; userId: string }) {
    return prisma.like.create({
      data,
    })
  }

  async delete(postId: string, userId: string) {
    return prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })
  }

  async findUnique(postId: string, userId: string) {
    return prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })
  }

  async countByPost(postId: string) {
    return prisma.like.count({
      where: { postId },
    })
  }
}

export const likeRepository = new LikeRepository()

