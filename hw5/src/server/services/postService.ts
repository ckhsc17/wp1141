import { postRepository } from '../repositories/postRepository'
import { CreatePostInput, UpdatePostInput, PaginationInput } from '@/schemas/post.schema'
import { mentionService } from './mentionService'
import { followRepository } from '../repositories/followRepository'
import { userRepository } from '../repositories/userRepository'

export class PostService {
  async createPost(data: CreatePostInput, authorId: string) {
    console.log('[PostService] Creating post:', {
      authorId,
      contentLength: data.content.length,
      contentPreview: data.content.substring(0, 50),
    })
    
    const post = await postRepository.create({
      content: data.content,
      authorId,
    })

    console.log('[PostService] Post created successfully:', {
      postId: post.id,
    })

    // Create mentions if any
    try {
      console.log('[PostService] Processing mentions for post:', post.id)
      await mentionService.createMentions({
        content: data.content,
        mentionerId: authorId,
        postId: post.id,
      })
      console.log('[PostService] Mentions processed successfully for post:', post.id)
    } catch (error) {
      console.error('[PostService] Failed to create mentions for post:', {
        postId: post.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      // Don't throw - post creation should succeed even if mentions fail
    }

    return post
  }

  async getPosts(pagination: PaginationInput, userId?: string) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const posts = await postRepository.findMany({
      skip,
      take: limit,
    })

    const total = await postRepository.count()

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getPostById(id: string) {
    const post = await postRepository.findById(id)
    if (!post) {
      throw new Error('Post not found')
    }
    return post
  }

  async updatePost(id: string, data: UpdatePostInput, userId: string) {
    const post = await postRepository.findById(id)
    if (!post) {
      throw new Error('Post not found')
    }
    if (post.authorId !== userId) {
      throw new Error('Unauthorized')
    }
    return postRepository.update(id, data)
  }

  async deletePost(id: string, userId: string) {
    const post = await postRepository.findById(id)
    if (!post) {
      throw new Error('Post not found')
    }
    if (post.authorId !== userId) {
      throw new Error('Unauthorized')
    }
    return postRepository.delete(id)
  }

  async getUserPosts(userId: string, pagination: PaginationInput) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const posts = await postRepository.findMany({
      skip,
      take: limit,
      where: {
        author: {
          userId,
        },
        originalPostId: null, // Exclude reposts from regular posts
      } as any,
    })

    const total = await postRepository.count({
      author: {
        userId,
      },
      originalPostId: null, // Exclude reposts from count
    } as any)

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getFollowingPosts(userId: string, pagination: PaginationInput) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    // Get user's internal ID from userId
    const user = await userRepository.findByUserId(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get all users that the current user follows
    const { prisma } = await import('@/lib/prisma')
    const follows = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    })

    const followingIds = follows.map((f) => f.followingId)

    if (followingIds.length === 0) {
      return {
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      }
    }

    // Get posts from followed users (including reposts)
    const posts = await postRepository.findMany({
      skip,
      take: limit,
      where: {
        authorId: {
          in: followingIds,
        },
      } as any,
    })

    const total = await postRepository.count({
      authorId: {
        in: followingIds,
      },
    } as any)

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}

export const postService = new PostService()

