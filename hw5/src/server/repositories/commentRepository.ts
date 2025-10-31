import { prisma } from '@/lib/prisma'

export class CommentRepository {
  async create(data: { content: string; postId: string; authorId: string }) {
    return prisma.comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
      },
    })
  }

  async findManyByPost(postId: string) {
    return prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
      },
    })
  }

  async delete(id: string) {
    return prisma.comment.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
      },
    })
  }
}

export const commentRepository = new CommentRepository()

