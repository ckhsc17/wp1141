import { likeRepository } from '../repositories/likeRepository'
import { postRepository } from '../repositories/postRepository'
import { notificationService } from './notificationService'

export class LikeService {
  async toggleLike(postId: string, userId: string) {
    // 檢查貼文是否存在
    const post = await postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    // 檢查是否已按讚
    const existingLike = await likeRepository.findUnique(postId, userId)

    if (existingLike) {
      // 取消按讚
      await likeRepository.delete(postId, userId)
      return { liked: false }
    } else {
      // 按讚
      await likeRepository.create({ postId, userId })
      
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
      
      return { liked: true }
    }
  }

  async getLikeStatus(postId: string, userId: string) {
    const like = await likeRepository.findUnique(postId, userId)
    return { liked: !!like }
  }

  async getLikeCount(postId: string) {
    const count = await likeRepository.countByPost(postId)
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
    
    // Get posts from likes
    const { postRepository } = await import('../repositories/postRepository')
    const posts = await Promise.all(
      likes.map(async (like) => {
        const post = await postRepository.findById(like.postId)
        return post
      })
    )

    // Filter out null posts and get total count
    const validPosts = posts.filter((post): post is NonNullable<typeof post> => post !== null)
    const total = await likeRepository.countByUserId(user.id)

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

