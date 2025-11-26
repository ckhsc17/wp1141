import { prisma } from '@/lib/prisma'

interface CreateMentionData {
  postId?: string
  commentId?: string
  mentionerId: string
  mentionedId: string
}

export class MentionRepository {
  async create(data: CreateMentionData) {
    return prisma.mention.create({
      data,
    })
  }

  async createMany(data: CreateMentionData[]) {
    return prisma.mention.createMany({
      data,
    })
  }

  async findByMentionedId(
    userId: string,
    options?: { skip?: number; take?: number; include?: any }
  ) {
    return prisma.mention.findMany({
      where: {
        mentionedId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: options?.skip,
      take: options?.take,
      include: options?.include || {
        mentioner: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            authorId: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            authorId: true,
          },
        },
      },
    })
  }

  async findByPostId(postId: string) {
    return prisma.mention.findMany({
      where: {
        postId,
      },
      include: {
        mentioner: {
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

  async findByCommentId(commentId: string) {
    return prisma.mention.findMany({
      where: {
        commentId,
      },
      include: {
        mentioner: {
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

  async markAsRead(id: string) {
    return prisma.mention.update({
      where: { id },
      data: { read: true },
    })
  }

  async markAllAsRead(userId: string) {
    return prisma.mention.updateMany({
      where: {
        mentionedId: userId,
        read: false,
      },
      data: { read: true },
    })
  }

  async getUnreadCount(userId: string) {
    return prisma.mention.count({
      where: {
        mentionedId: userId,
        read: false,
      },
    })
  }

  async countByMentionedId(userId: string) {
    return prisma.mention.count({
      where: {
        mentionedId: userId,
      },
    })
  }
}

export const mentionRepository = new MentionRepository()



