import { NextRequest, NextResponse } from 'next/server'
import { postService } from '../services/postService'
import { createPostSchema, updatePostSchema, paginationSchema } from '@/schemas/post.schema'

export class PostController {
  async getPosts(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams
      const pagination = paginationSchema.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
      })

      const result = await postService.getPosts(pagination)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      )
    }
  }

  async createPost(request: NextRequest, userId: string) {
    const startTime = Date.now()
    console.log('[PostController] ===== POST REQUEST RECEIVED =====')
    console.log('[PostController] createPost called:', { 
      userId,
      timestamp: new Date().toISOString(),
    })
    
    try {
      const body = await request.json()
      console.log('[PostController] Request body received:', {
        contentLength: body.content?.length || 0,
        contentPreview: body.content?.substring(0, 100) || '',
      })
      
      const data = createPostSchema.parse(body)
      console.log('[PostController] Data validated successfully:', {
        contentLength: data.content.length,
      })

      const post = await postService.createPost(data, userId)
      
      const duration = Date.now() - startTime
      console.log('[PostController] Post created successfully:', {
        postId: post.id,
        duration: `${duration}ms`,
      })
      console.log('[PostController] ===== POST REQUEST COMPLETED =====')
      
      return NextResponse.json({ post }, { status: 201 })
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('[PostController] Error creating post:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`,
      })
      console.error('[PostController] ===== POST REQUEST FAILED =====')
      
      if (error instanceof Error && error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }
  }

  async getPost(postId: string) {
    try {
      const post = await postService.getPostById(postId)
      return NextResponse.json({ post })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Post not found' },
        { status: 404 }
      )
    }
  }

  async updatePost(postId: string, request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      const data = updatePostSchema.parse(body)

      const post = await postService.updatePost(postId, data, userId)
      return NextResponse.json({ post })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
      }
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }
  }

  async deletePost(postId: string, userId: string) {
    try {
      await postService.deletePost(postId, userId)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        if (error.message === 'Post not found') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
      }
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }
  }

  async getUserPosts(userId: string, request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams
      const pagination = paginationSchema.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
      })

      const result = await postService.getUserPosts(userId, pagination)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get user posts' },
        { status: 500 }
      )
    }
  }
}

export const postController = new PostController()

