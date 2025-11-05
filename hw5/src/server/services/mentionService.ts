import { mentionRepository } from '../repositories/mentionRepository'
import { userRepository } from '../repositories/userRepository'
import { pusherServer } from '@/lib/pusher-server'
import { extractMentions } from '@/utils/mention'

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
      content: content.substring(0, 100), // 只顯示前 100 個字元
    })
    
    if (userIds.length === 0) {
      console.log('[MentionService] No mentions found in content, returning early')
      return []
    }

    // Validate that all mentioned users exist and exclude the mentioner
    const validUserIds = await this.validateUserIds(userIds, mentionerId)
    console.log('[MentionService] Valid user IDs after validation:', validUserIds)
    
    if (validUserIds.length === 0) {
      return []
    }

    // Create mention records
    const mentionData = validUserIds.map((userId) => ({
      postId,
      commentId,
      mentionerId,
      mentionedId: userId,
    }))

    console.log('[MentionService] Creating mention records:', {
      count: mentionData.length,
      mentionData: mentionData.map(m => ({
        postId: m.postId,
        commentId: m.commentId,
        mentionerId: m.mentionerId,
        mentionedId: m.mentionedId,
      })),
    })

    const mentions = await mentionRepository.createMany(mentionData)
    
    console.log('[MentionService] Mention records created successfully:', {
      count: mentions.count,
      postId,
      commentId,
    })

    // Send Pusher notifications for each mention (if Pusher is configured)
    console.log('[MentionService] Starting to send Pusher notifications for', validUserIds.length, 'mentions')
    
    for (const userId of validUserIds) {
      console.log('[MentionService] Sending notification to user:', userId)
      await this.sendMentionNotification({
        mentionedUserId: userId,
        mentionerId,
        type: postId ? 'post' : 'comment',
        contentId: postId || commentId || '',
      })
    }
    
    console.log('[MentionService] All Pusher notifications sent, returning mention data')

    return mentionData
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
    mentionedUserId: string
    mentionerId: string
    type: 'post' | 'comment'
    contentId: string
  }) {
    const startTime = Date.now()
    
    console.log('[MentionService] Preparing to send Pusher notification:', {
      mentionedUserId,
      mentionerId,
      type,
      contentId,
      hasPusherServer: !!pusherServer,
    })
    
    if (!pusherServer) {
      console.warn('[MentionService] Pusher not configured, skipping notification')
      return
    }

    const mentioner = await userRepository.findById(mentionerId)
    if (!mentioner) {
      console.error('[MentionService] Mentioner not found:', mentionerId)
      return
    }

    const channelName = `private-user-${mentionedUserId}`
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
      mentioner: mentioner.userId,
      mentionerName: mentioner.name,
      type,
      contentId,
      payloadSize: JSON.stringify(payload).length,
    })

    try {
      const result = await pusherServer.trigger(channelName, eventName, payload)
      const duration = Date.now() - startTime
      
      console.log('[MentionService] Pusher notification sent successfully:', {
        channel: channelName,
        event: eventName,
        duration: `${duration}ms`,
        result: result,
      })
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('[MentionService] Failed to send Pusher notification:', {
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

