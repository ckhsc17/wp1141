import { postRepository } from '../repositories/postRepository'
import { CreatePostInput, UpdatePostInput, PaginationInput } from '@/schemas/post.schema'
import { mentionService } from './mentionService'
import { userRepository } from '../repositories/userRepository'
import { calculateTrendingScore, extractTrendingInputFromPost } from '../utils/feedScore'
import { pusherServer } from '@/lib/pusher-server'

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

    // Broadcast new post event to all users
    try {
      if (pusherServer) {
        // Fetch full post with author data
        const fullPost: any = await postRepository.findById(post.id)
        if (fullPost && fullPost.author) {
          await pusherServer.trigger('public-feed', 'new-post', {
            postId: fullPost.id,
            authorId: fullPost.authorId,
            author: {
              userId: fullPost.author.userId,
              name: fullPost.author.name,
              image: fullPost.author.image,
            },
            contentPreview: data.content.substring(0, 100),
            createdAt: fullPost.createdAt.toISOString(),
          })
          console.log('[PostService] New post event broadcasted:', fullPost.id)
        }
      }
    } catch (error) {
      console.error('[PostService] Failed to broadcast new post event:', error)
      // Don't throw - post creation should succeed even if broadcast fails
    }

    return post
  }

  async getPosts(pagination: PaginationInput, userId?: string) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const posts = await postRepository.findMany({
      skip,
      take: limit,
      where: {
        originalCommentId: null,
      } as any,
      currentUserId: userId,
    })

    const total = await postRepository.count({
      originalCommentId: null,
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

  async getUserPosts(userId: string, pagination: PaginationInput, currentUserId?: string) {
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
        originalCommentId: null,
      } as any,
      currentUserId,
    })

    const total = await postRepository.count({
      author: {
        userId,
      },
      originalPostId: null, // Exclude reposts from count
      originalCommentId: null,
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

  async getFollowingPosts(userId: string, pagination: PaginationInput, currentUserId?: string) {
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
        originalCommentId: null,
      } as any,
      currentUserId,
    })

    const total = await postRepository.count({
      authorId: {
        in: followingIds,
      },
      originalCommentId: null,
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

  async getExploreFeed(pagination: PaginationInput, viewerId?: string) {
    const { page, limit } = pagination
    const offset = (page - 1) * limit

    const { prisma } = await import('@/lib/prisma')

    let excludedAuthorIds: string[] = []

    if (viewerId) {
      const followings = await prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      })

      excludedAuthorIds = followings.map((f) => f.followingId)
      excludedAuthorIds.push(viewerId)
    }

    const baseWhere = {
      originalCommentId: null,
      ...(excludedAuthorIds.length
        ? {
            authorId: {
              notIn: excludedAuthorIds,
            },
          }
        : {}),
    } as any

    const total = await postRepository.count(baseWhere)

    if (total === 0) {
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

    const candidateTake = Math.min(
      Math.max(limit * page * 4, limit),
      Math.max(total, limit)
    )

    const candidates = await postRepository.findMany({
      skip: 0,
      take: candidateTake,
      where: baseWhere,
      currentUserId: viewerId,
    })

    const scored = candidates.map((post) => ({
      post,
      score: calculateTrendingScore(extractTrendingInputFromPost(post)),
    }))

    const sorted = scored.sort((a, b) => b.score - a.score)
    const sliced = sorted.slice(offset, offset + limit)

    return {
      posts: sliced.map((item) => item.post),
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

