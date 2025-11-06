import { prisma } from '@/lib/prisma'

export class NotificationRepository {
  async create(data: {
    type: string
    userId: string
    actorId: string
    postId?: string | null
    commentId?: string | null
    mentionId?: string | null
  }) {
    return prisma.notification.create({
      data,
      include: {
        actor: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
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
          },
        },
        comment: {
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
        },
      },
    })
  }

  async findByUserId(userId: string, options: { skip: number; take: number }) {
    return prisma.notification.findMany({
      where: { userId },
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
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
          },
        },
        comment: {
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
        },
      },
    })
  }

  async countUnreadByUserId(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    })
  }

  async countByUserId(userId: string) {
    return prisma.notification.count({
      where: { userId },
    })
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user can only mark their own notifications as read
      },
      data: { read: true },
    })
  }
}

export const notificationRepository = new NotificationRepository()

