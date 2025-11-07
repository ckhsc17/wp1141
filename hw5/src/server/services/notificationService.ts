import { notificationRepository } from '../repositories/notificationRepository'
import { userRepository } from '../repositories/userRepository'
import { pusherServer } from '@/lib/pusher-server'

interface CreateNotificationParams {
  type: 'like' | 'comment' | 'mention'
  userId: string // 接收通知的用户 ID (internal)
  actorId: string // 触发通知的用户 ID (internal)
  postId?: string | null
  commentId?: string | null
  mentionId?: string | null
}

export class NotificationService {
  async createNotification({
    type,
    userId,
    actorId,
    postId,
    commentId,
    mentionId,
  }: CreateNotificationParams) {
    console.log('[NotificationService] createNotification called:', {
      type,
      userId,
      actorId,
      postId,
      commentId,
      mentionId,
    })

    // 不给自己发通知
    if (userId === actorId) {
      console.log('[NotificationService] Skipping notification - user is actor')
      return null
    }

    // 创建通知记录
    const notification = await notificationRepository.create({
      type,
      userId,
      actorId,
      postId,
      commentId,
      mentionId,
    })

    console.log('[NotificationService] Notification created:', notification.id)

    // 发送 Pusher 通知
    await this.sendNotificationViaPusher(userId, notification)

    return notification
  }

  async sendNotificationViaPusher(userId: string, notification: any) {
    console.log('[NotificationService] sendNotificationViaPusher called:', {
      userId,
      notificationId: notification.id,
      hasPusherServer: !!pusherServer,
    })

    if (!pusherServer) {
      console.warn('[NotificationService] Pusher server not available, skipping notification')
      return
    }

    // 获取用户的 userId (自定义 ID) 用于 Pusher channel
    const user = await userRepository.findById(userId)
    if (!user || !user.userId) {
      console.error('[NotificationService] User not found or missing userId:', userId)
      return
    }

    const channelName = `private-user-${user.userId}`
    const eventName = 'notification-created'

    const payload = {
      id: notification.id,
      type: notification.type,
      actor: {
        id: notification.actor.id,
        userId: notification.actor.userId,
        name: notification.actor.name,
        image: notification.actor.image,
      },
      post: notification.post
        ? {
            id: notification.post.id,
            content: notification.post.content,
          }
        : undefined,
      comment: notification.comment
        ? {
            id: notification.comment.id,
            content: notification.comment.content,
          }
        : undefined,
      createdAt: notification.createdAt.toISOString(),
    }

    console.log('[NotificationService] Sending Pusher notification:', {
      channel: channelName,
      event: eventName,
      userId: user.userId,
      type: notification.type,
    })

    try {
      await pusherServer.trigger(channelName, eventName, payload)
      console.log('[NotificationService] ✅ Pusher notification sent successfully')
    } catch (error) {
      console.error('[NotificationService] ❌ Failed to send Pusher notification:', error)
    }
  }

  async getUserNotifications(userId: string, { page, limit }: { page: number; limit: number }) {
    console.log('[NotificationService] getUserNotifications called:', { userId, page, limit })
    const skip = (page - 1) * limit

    try {
      const [notifications, total] = await Promise.all([
        notificationRepository.findByUserId(userId, { skip, take: limit }),
        notificationRepository.countByUserId(userId),
      ])

      console.log('[NotificationService] getUserNotifications success:', {
        notificationsCount: notifications.length,
        total,
      })

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error('[NotificationService] getUserNotifications error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  async getUnreadCount(userId: string) {
    console.log('[NotificationService] getUnreadCount called:', { userId })
    try {
      const count = await notificationRepository.countUnreadByUserId(userId)
      console.log('[NotificationService] getUnreadCount success:', { count })
      return count
    } catch (error) {
      console.error('[NotificationService] getUnreadCount error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  async markAllAsRead(userId: string) {
    console.log('[NotificationService] markAllAsRead called:', { userId })
    try {
      const result = await notificationRepository.markAllAsRead(userId)
      console.log('[NotificationService] markAllAsRead success:', { updated: result.count })
      return result
    } catch (error) {
      console.error('[NotificationService] markAllAsRead error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }
}

export const notificationService = new NotificationService()

