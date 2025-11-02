import { NextRequest, NextResponse } from 'next/server'
import { commentService } from '../services/commentService'
import { createCommentSchema } from '@/schemas/comment.schema'

export class CommentController {
  async getComments(postId: string) {
    try {
      const comments = await commentService.getCommentsByPost(postId)
      return NextResponse.json({ comments })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get comments' },
        { status: error instanceof Error && error.message === 'Post not found' ? 404 : 500 }
      )
    }
  }

  async createComment(postId: string, request: NextRequest, userId: string, parentId?: string) {
    try {
      const body = await request.json()
      const data = createCommentSchema.parse(body)

      const comment = await commentService.createComment(data, postId, userId, parentId)
      return NextResponse.json({ comment }, { status: 201 })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create comment' },
        { status: error instanceof Error && error.message === 'Post not found' ? 404 : 400 }
      )
    }
  }

  async getReplies(commentId: string) {
    try {
      const replies = await commentService.getReplies(commentId)
      return NextResponse.json({ replies })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get replies' },
        { status: error instanceof Error && error.message === 'Comment not found' ? 404 : 500 }
      )
    }
  }

  async createReply(commentId: string, request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      const data = createCommentSchema.parse(body)

      const reply = await commentService.createReply(data, commentId, userId)
      return NextResponse.json({ reply }, { status: 201 })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create reply' },
        { status: error instanceof Error && error.message === 'Parent comment not found' ? 404 : 400 }
      )
    }
  }

  async deleteComment(commentId: string, userId: string) {
    try {
      await commentService.deleteComment(commentId, userId)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        if (error.message === 'Comment not found') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
      }
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }
  }
}

export const commentController = new CommentController()

