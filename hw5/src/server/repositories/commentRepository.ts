import { prisma } from '@/lib/prisma'

export class CommentRepository {
  async create(data: { content: string; postId: string; authorId: string; parentId?: string | null }) {
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
        _count: {
          select: {
            replies: true,
            likes: true,
            repostRecords: true,
          },
        },
      },
    })
  }

  async findManyByPost(postId: string) {
    return prisma.comment.findMany({
      where: { postId, parentId: null },  // 只查詢頂層留言
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
        _count: {
          select: {
            replies: true,
            likes: true,
            repostRecords: true,
          },
        },
      },
    })
  }

  async findManyByParent(parentId: string) {
    return prisma.comment.findMany({
      where: { parentId },
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
        _count: {
          select: {
            replies: true,
            likes: true,
            repostRecords: true,
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
        _count: {
          select: {
            replies: true,
            likes: true,
            repostRecords: true,
          },
        },
      },
    })
  }
}

export const commentRepository = new CommentRepository()

