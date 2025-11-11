import { likeRepository } from '../repositories/likeRepository'
import { postRepository } from '../repositories/postRepository'
import { commentRepository } from '../repositories/commentRepository'
import { notificationService } from './notificationService'
import { pusherServer } from '@/lib/pusher-server'

export class LikeService {
  async toggleLike(postId: string, userId: string) {
    // 檢查貼文是否存在
    const post = await postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    // 檢查是否已按讚
    const existingLike = await likeRepository.findUnique(postId, null, userId)

    let result
    if (existingLike) {
      // 取消按讚
      await likeRepository.delete(postId, null, userId)
      result = { liked: false }
    } else {
      // 按讚
      await likeRepository.create({ postId, commentId: null, userId })
      
      // 发送通知给贴文作者（如果不是自己）
      if (post.authorId !== userId) {
        console.log('[LikeService] Creating notification for like:', {
          postId: post.id,
          postAuthorId: post.authorId,
          likerId: userId,
        })
        try {
          const notification = await notificationService.createNotification({
            type: 'like',
            userId: post.authorId,
            actorId: userId,
            postId: post.id,
          })
          console.log('[LikeService] ✅ Notification created successfully:', notification?.id)
        } catch (error) {
          console.error('[LikeService] ❌ Failed to create notification:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
          // 不抛出错误，避免影响 like 操作
        }
      } else {
        console.log('[LikeService] Skipping notification - user is post author')
      }
      
      result = { liked: true }
    }

    // Broadcast like/unlike event to all users for silent count update
    try {
      if (pusherServer) {
        const updatedPost: any = await postRepository.findById(postId)
        if (updatedPost && updatedPost._count) {
          await pusherServer.trigger('public-feed', 'post-stats-updated', {
            postId: postId,
            likes: updatedPost._count.likes ?? 0,
            comments: updatedPost._count.comments ?? 0,
            reposts: updatedPost._count.repostRecords ?? 0,
          })
        }
      }
    } catch (error) {
      console.error('[LikeService] Failed to broadcast stats update:', error)
      // Don't throw - like operation should succeed even if broadcast fails
    }

    return result
  }

  async toggleCommentLike(commentId: string, userId: string) {
    // 檢查留言是否存在
    const comment = await commentRepository.findById(commentId)
    if (!comment) {
      throw new Error('Comment not found')
    }

    // 檢查是否已按讚
    const existingLike = await likeRepository.findUnique(null, commentId, userId)

    if (existingLike) {
      // 取消按讚
      await likeRepository.delete(null, commentId, userId)
      return { liked: false }
    } else {
      // 按讚
      await likeRepository.create({ postId: null, commentId, userId })
      
      // 发送通知给留言作者（如果不是自己）
      if (comment.authorId !== userId) {
        console.log('[LikeService] Creating notification for comment like:', {
          commentId: comment.id,
          commentAuthorId: comment.authorId,
          likerId: userId,
        })
        try {
          const notification = await notificationService.createNotification({
            type: 'like',
            userId: comment.authorId,
            actorId: userId,
            commentId: comment.id,
            postId: comment.postId, // 用于跳转
          })
          console.log('[LikeService] ✅ Notification created successfully:', notification?.id)
        } catch (error) {
          console.error('[LikeService] ❌ Failed to create notification:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
          // 不抛出错误，避免影响 like 操作
        }
      } else {
        console.log('[LikeService] Skipping notification - user is comment author')
      }
      
      return { liked: true }
    }
  }

  async getLikeStatus(postId: string, userId: string) {
    const like = await likeRepository.findUnique(postId, null, userId)
    return { liked: !!like }
  }

  async getCommentLikeStatus(commentId: string, userId: string) {
    const like = await likeRepository.findUnique(null, commentId, userId)
    return { liked: !!like }
  }

  async getLikeCount(postId: string) {
    const count = await likeRepository.countByPost(postId)
    return { count }
  }

  async getCommentLikeCount(commentId: string) {
    const count = await likeRepository.countByComment(commentId)
    return { count }
  }

  async getUserLikedPosts(userId: string, { page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit
    
    // Get user's internal ID from userId
    const { userRepository } = await import('../repositories/userRepository')
    const user = await userRepository.findByUserId(userId)
    
    if (!user) {
      throw new Error('User not found')
    }

    // Get likes by user
    const likes = await likeRepository.findByUserId(user.id, { skip, take: limit })
    
    // Get posts from likes (filter out comment likes)
    const { postRepository } = await import('../repositories/postRepository')
    const posts = await Promise.all(
      likes
        .filter((like) => like.postId !== null)
        .map(async (like) => {
          const post = await postRepository.findById(like.postId!)
          return post
        })
    )

    // Filter out null posts and get total count (only post likes)
    const validPosts = posts.filter((post): post is NonNullable<typeof post> => post !== null)
    const allLikes = await likeRepository.findByUserId(user.id, { skip: 0, take: 10000 })
    const total = allLikes.filter((like) => like.postId !== null).length

    return {
      posts: validPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}

export const likeService = new LikeService()

