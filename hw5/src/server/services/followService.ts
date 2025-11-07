import { followRepository } from '../repositories/followRepository'
import { notificationService } from './notificationService'

export class FollowService {
  async checkFollowStatus(followerId: string, followingId: string) {
    // 不能追蹤自己
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself')
    }

    const isFollowing = await followRepository.isFollowing(followerId, followingId)
    return { isFollowing }
  }

  async toggleFollow(followerId: string, followingId: string) {
    // 不能追蹤自己
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself')
    }

    const isFollowing = await followRepository.isFollowing(followerId, followingId)
    
    if (isFollowing) {
      await followRepository.unfollow(followerId, followingId)
      return { isFollowing: false }
    } else {
      await followRepository.follow(followerId, followingId)
      try {
        await notificationService.createNotification({
          type: 'follow',
          userId: followingId,
          actorId: followerId,
        })
      } catch (error) {
        console.error('[FollowService] Failed to create follow notification:', {
          error: error instanceof Error ? error.message : String(error),
          followerId,
          followingId,
        })
      }
      return { isFollowing: true }
    }
  }
}

export const followService = new FollowService()

