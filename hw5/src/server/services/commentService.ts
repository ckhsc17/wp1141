import { commentRepository } from '../repositories/commentRepository'
import { postRepository } from '../repositories/postRepository'
import { CreateCommentInput } from '@/schemas/comment.schema'

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

    return commentRepository.create({
      content: data.content,
      postId,
      authorId,
      parentId: parentId || null,
    })
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
    return commentRepository.create({
      content: data.content,
      postId: parentComment.postId,
      authorId,
      parentId: parentCommentId,
    })
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

