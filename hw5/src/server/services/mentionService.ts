import { mentionRepository } from '../repositories/mentionRepository'
import { userRepository } from '../repositories/userRepository'
import { pusherServer } from '@/lib/pusher-server'
import { extractMentions } from '@/utils/mention'
import { notificationService } from './notificationService'

interface CreateMentionsParams {
  content: string
  mentionerId: string
  postId?: string
  commentId?: string
}

interface PaginationParams {
  page: number
  limit: number
}

export class MentionService {
  /**
   * Extract @mentions from content and create mention records
   */
  async createMentions({ content, mentionerId, postId, commentId }: CreateMentionsParams) {
    console.log('[MentionService] createMentions called:', {
      contentLength: content.length,
      mentionerId,
      postId,
      commentId,
      hasPostId: !!postId,
      hasCommentId: !!commentId,
    })
    
    if (!postId && !commentId) {
      console.error('[MentionService] Either postId or commentId must be provided')
      throw new Error('Either postId or commentId must be provided')
    }

    const userIds = extractMentions(content)
    console.log('[MentionService] Extracted mentions from content:', {
      userIds,
      count: userIds.length,
      content: content.substring(0, 100),
    })
    
    if (userIds.length === 0) {
      console.log('[MentionService] No mentions found in content, returning early')
      return []
    }

    // Validate that all mentioned users exist and exclude the mentioner
    const validUserIds = await this.validateUserIds(userIds, mentionerId)
    console.log('[MentionService] Valid user IDs after validation:', {
      validUserIds,
      count: validUserIds.length,
    })
    
    if (validUserIds.length === 0) {
      console.log('[MentionService] No valid user IDs after validation, returning early')
      return []
    }

    // Process each mention individually to create both mention and notification records
    console.log('[MentionService] Starting to process', validUserIds.length, 'mentions')
    for (const userId of validUserIds) {
      console.log('[MentionService] Processing mention for user ID:', userId)
      
      // 创建 mention 记录
      const mention = await mentionRepository.create({
        postId: postId || undefined,
        commentId: commentId || undefined,
        mentionerId,
        mentionedId: userId,
      })
      
      console.log('[MentionService] Mention record created:', mention.id)
      
      // 创建通知记录
      try {
        await notificationService.createNotification({
          type: 'mention',
          userId,
          actorId: mentionerId,
          postId: postId || undefined,
          commentId: commentId || undefined,
          mentionId: mention.id,
        })
        console.log('[MentionService] Notification created for mention:', mention.id)
      } catch (error) {
        console.error('[MentionService] Failed to create notification:', error)
      }
      
      // 发送 Pusher 通知（保持向后兼容）
      await this.sendMentionNotification({
        mentionedUserId: userId,
        mentionerId,
        type: postId ? 'post' : 'comment',
        contentId: postId || commentId || '',
      })
    }
    console.log('[MentionService] All mentions processed')

    return validUserIds.map((userId) => ({
      postId,
      commentId,
      mentionerId,
      mentionedId: userId,
    }))
  }

  /**
   * Validate that all user IDs exist and return their internal IDs
   */
  async validateUserIds(userIds: string[], excludeUserId?: string): Promise<string[]> {
    const validUserIds: string[] = []

    for (const userId of userIds) {
      const user = await userRepository.findByUserId(userId)
      if (user && (!excludeUserId || user.id !== excludeUserId)) {
        validUserIds.push(user.id)
      }
    }

    return validUserIds
  }

  /**
   * Get user's mentions with pagination
   */
  async getUserMentions(userId: string, { page, limit }: PaginationParams) {
    const skip = (page - 1) * limit
    
    const [mentions, total] = await Promise.all([
      mentionRepository.findByMentionedId(userId, { skip, take: limit }),
      mentionRepository.countByMentionedId(userId),
    ])

    return {
      data: mentions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Send Pusher notification for a mention
   */
  async sendMentionNotification({
    mentionedUserId,
    mentionerId,
    type,
    contentId,
  }: {
    mentionedUserId: string // 這是內部 ID (user.id)
    mentionerId: string
    type: 'post' | 'comment'
    contentId: string
  }) {
    const startTime = Date.now()
    console.log('[MentionService] sendMentionNotification called:', {
      mentionedUserId,
      mentionerId,
      type,
      contentId,
      hasPusherServer: !!pusherServer,
    })
    
    if (!pusherServer) {
      console.warn('[MentionService] Pusher server not available, skipping notification')
      return
    }

    // 獲取被提及用戶的資訊（需要 userId 來構建頻道名）
    console.log('[MentionService] Fetching mentioned user by ID:', mentionedUserId)
    const mentionedUser = await userRepository.findById(mentionedUserId)
    console.log('[MentionService] Mentioned user found:', {
      found: !!mentionedUser,
      userId: mentionedUser?.userId,
      name: mentionedUser?.name,
    })
    
    if (!mentionedUser || !mentionedUser.userId) {
      console.error('[MentionService] Mentioned user not found or missing userId:', {
        mentionedUserId,
        found: !!mentionedUser,
        hasUserId: !!mentionedUser?.userId,
      })
      return
    }

    console.log('[MentionService] Fetching mentioner by ID:', mentionerId)
    const mentioner = await userRepository.findById(mentionerId)
    console.log('[MentionService] Mentioner found:', {
      found: !!mentioner,
      userId: mentioner?.userId,
      name: mentioner?.name,
    })
    
    if (!mentioner) {
      console.error('[MentionService] Mentioner not found:', mentionerId)
      return
    }

    // 使用 userId（不是內部 ID）來構建頻道名，與客戶端訂閱一致
    const channelName = `private-user-${mentionedUser.userId}`
    const eventName = 'mention-created'
    const payload = {
      mentioner: {
        id: mentioner.id,
        userId: mentioner.userId,
        name: mentioner.name,
        image: mentioner.image,
      },
      type,
      contentId,
      createdAt: new Date().toISOString(),
    }

    console.log('[MentionService] Sending Pusher notification:', {
      channel: channelName,
      event: eventName,
      mentionedUserId_internal: mentionedUserId,
      mentionedUserId: mentionedUser.userId,
      mentionerUserId: mentioner.userId,
      type,
      contentId,
      payloadSize: JSON.stringify(payload).length,
    })

    try {
      const result = await pusherServer.trigger(channelName, eventName, payload)
      const duration = Date.now() - startTime
      console.log('[MentionService] ✅ Pusher notification sent successfully:', {
        channel: channelName,
        event: eventName,
        duration: `${duration}ms`,
        result,
      })
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('[MentionService] ❌ Failed to send Pusher notification:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        channel: channelName,
        event: eventName,
        duration: `${duration}ms`,
      })
      // Don't throw - Pusher failures shouldn't break the application
    }
  }

  /**
   * Mark a mention as read
   */
  async markAsRead(mentionId: string, userId: string) {
    const mention = await mentionRepository.findByMentionedId(userId)
    const foundMention = mention.find((m) => m.id === mentionId)
    
    if (!foundMention) {
      throw new Error('Mention not found or unauthorized')
    }

    return mentionRepository.markAsRead(mentionId)
  }

  /**
   * Mark all mentions as read for a user
   */
  async markAllAsRead(userId: string) {
    return mentionRepository.markAllAsRead(userId)
  }

  /**
   * Get unread mention count for a user
   */
  async getUnreadCount(userId: string) {
    return mentionRepository.getUnreadCount(userId)
  }
}

export const mentionService = new MentionService()

