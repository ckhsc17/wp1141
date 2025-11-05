import { commentRepository } from '../repositories/commentRepository'
import { postRepository } from '../repositories/postRepository'
import { CreateCommentInput } from '@/schemas/comment.schema'
import { mentionService } from './mentionService'

export class CommentService {
  async createComment(
    data: CreateCommentInput,
    postId: string,
    authorId: string,
    parentId?: string | null
  ) {
    // 檢查貼文是否存在
    const post = await postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    // 如果有 parentId，檢查父留言是否存在
    if (parentId) {
      const parentComment = await commentRepository.findById(parentId)
      if (!parentComment) {
        throw new Error('Parent comment not found')
      }
      // 確保父留言屬於同一個貼文
      if (parentComment.postId !== postId) {
        throw new Error('Parent comment does not belong to this post')
      }
    }

    const comment = await commentRepository.create({
      content: data.content,
      postId,
      authorId,
      parentId: parentId || null,
    })

    // Create mentions if any
    try {
      console.log('[CommentService] Attempting to create mentions for comment:', {
        commentId: comment.id,
        content: data.content,
        authorId,
      })
      
      await mentionService.createMentions({
        content: data.content,
        mentionerId: authorId,
        commentId: comment.id,
      })
      
      console.log('[CommentService] Mentions processed successfully for comment:', comment.id)
    } catch (error) {
      console.error('[CommentService] Failed to create mentions for comment:', {
        commentId: comment.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      // Don't throw - comment creation should succeed even if mentions fail
    }

    return comment
  }

  async getCommentsByPost(postId: string) {
    // 檢查貼文是否存在
    const post = await postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    return commentRepository.findManyByPost(postId)
  }

  async getReplies(commentId: string) {
    // 檢查留言是否存在
    const parentComment = await commentRepository.findById(commentId)
    if (!parentComment) {
      throw new Error('Comment not found')
    }

    return commentRepository.findManyByParent(commentId)
  }

  async createReply(
    data: CreateCommentInput,
    parentCommentId: string,
    authorId: string
  ) {
    // 檢查父留言是否存在
    const parentComment = await commentRepository.findById(parentCommentId)
    if (!parentComment) {
      throw new Error('Parent comment not found')
    }

    // 使用父留言的 postId
    const comment = await commentRepository.create({
      content: data.content,
      postId: parentComment.postId,
      authorId,
      parentId: parentCommentId,
    })

    // Create mentions if any
    try {
      console.log('[CommentService] Attempting to create mentions for reply:', {
        commentId: comment.id,
        content: data.content,
        authorId,
      })
      
      await mentionService.createMentions({
        content: data.content,
        mentionerId: authorId,
        commentId: comment.id,
      })
      
      console.log('[CommentService] Mentions processed successfully for reply:', comment.id)
    } catch (error) {
      console.error('[CommentService] Failed to create mentions for reply:', {
        commentId: comment.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      // Don't throw - reply creation should succeed even if mentions fail
    }

    return comment
  }

  async deleteComment(id: string, userId: string) {
    const comment = await commentRepository.findById(id)
    if (!comment) {
      throw new Error('Comment not found')
    }
    if (comment.authorId !== userId) {
      throw new Error('Unauthorized')
    }
    return commentRepository.delete(id)
  }
}

export const commentService = new CommentService()

