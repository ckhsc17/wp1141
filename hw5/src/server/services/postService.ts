import { postRepository } from '../repositories/postRepository'
import { CreatePostInput, UpdatePostInput, PaginationInput } from '@/schemas/post.schema'

export class PostService {
  async createPost(data: CreatePostInput, authorId: string) {
    return postRepository.create({
      content: data.content,
      authorId,
    })
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
      },
    })

    const total = await postRepository.count({
      author: {
        userId,
      },
    })

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

