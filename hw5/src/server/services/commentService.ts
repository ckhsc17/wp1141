import { commentRepository } from '../repositories/commentRepository'
import { postRepository } from '../repositories/postRepository'
import { CreateCommentInput } from '@/schemas/comment.schema'

export class CommentService {
  async createComment(
    data: CreateCommentInput,
    postId: string,
    authorId: string
  ) {
    // 檢查貼文是否存在
    const post = await postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    return commentRepository.create({
      content: data.content,
      postId,
      authorId,
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

