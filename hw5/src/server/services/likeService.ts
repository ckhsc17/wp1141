import { likeRepository } from '../repositories/likeRepository'
import { postRepository } from '../repositories/postRepository'

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
}

export const likeService = new LikeService()

