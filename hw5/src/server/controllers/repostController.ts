import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { repostService } from '../services/repostService'

export class RepostController {
  async toggleRepost(postId: string, userId: string) {
    console.log('[RepostController] toggleRepost called:', { postId, userId })
    try {
      const result = await repostService.toggleRepost(postId, userId)
      console.log('[RepostController] toggleRepost success:', result)
      return NextResponse.json(result)
    } catch (error) {
      console.error('[RepostController] toggleRepost error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to toggle repost' },
        { status: error instanceof Error && error.message === 'Post not found' ? 404 : 500 }
      )
    }
  }

  async getRepostStatus(postId: string, userId: string) {
    try {
      const result = await repostService.getRepostStatus(postId, userId)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get repost status' },
        { status: 500 }
      )
    }
  }

  async toggleCommentRepost(commentId: string, userId: string) {
    console.log('[RepostController] toggleCommentRepost called:', { commentId, userId })
    try {
      const result = await repostService.toggleCommentRepost(commentId, userId)
      console.log('[RepostController] toggleCommentRepost success:', result)
      return NextResponse.json(result)
    } catch (error) {
      console.error('[RepostController] toggleCommentRepost error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to toggle comment repost' },
        { status: error instanceof Error && error.message === 'Comment not found' ? 404 : 500 }
      )
    }
  }

  async getCommentRepostStatus(commentId: string, userId: string) {
    try {
      const result = await repostService.getCommentRepostStatus(commentId, userId)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get comment repost status' },
        { status: 500 }
      )
    }
  }

  async getUserReposts(userId: string, request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const result = await repostService.getUserReposts(userId, { page, limit })
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get user reposts' },
        { status: 500 }
      )
    }
  }
}

export const repostController = new RepostController()

