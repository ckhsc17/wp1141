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
    if (!postId && !commentId) {
      throw new Error('Either postId or commentId must be provided')
    }

    const userIds = extractMentions(content)
    
    if (userIds.length === 0) {
      return []
    }

    // Validate that all mentioned users exist and exclude the mentioner
    const validUserIds = await this.validateUserIds(userIds, mentionerId)
    
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

    const mentions = await mentionRepository.createMany(mentionData)

    // Send Pusher notifications for each mention (if Pusher is configured)
    for (const userId of validUserIds) {
      await this.sendMentionNotification({
        mentionedUserId: userId,
        mentionerId,
        type: postId ? 'post' : 'comment',
        contentId: postId || commentId || '',
      })
    }

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
    if (!pusherServer) {
      console.log('Pusher not configured, skipping notification')
      return
    }

    const mentioner = await userRepository.findById(mentionerId)
    if (!mentioner) {
      return
    }

    try {
      await pusherServer.trigger(
        `private-user-${mentionedUserId}`,
        'mention-created',
        {
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
      )
    } catch (error) {
      console.error('Failed to send Pusher notification:', error)
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

