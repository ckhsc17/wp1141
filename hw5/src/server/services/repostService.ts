import { repostRepository } from '../repositories/repostRepository'
import { postRepository } from '../repositories/postRepository'
import { commentRepository } from '../repositories/commentRepository'

export class RepostService {
  async toggleRepost(postId: string, userId: string) {
    console.log('[RepostService] toggleRepost called:', { postId, userId })
    
    // 檢查貼文是否存在
    const post = await postRepository.findById(postId)
    if (!post) {
      console.error('[RepostService] Post not found:', postId)
      throw new Error('Post not found')
    }

    console.log('[RepostService] Post found:', post.id)

    // 檢查是否已經 repost
    const existingRepost = await repostRepository.findUnique(postId, null, userId)
    console.log('[RepostService] Existing repost check:', { found: !!existingRepost })

    if (existingRepost) {
      // 取消 repost - 刪除 repost 記錄和 repost post
      // 先找到 repost post（由該用戶創建的，且 originalPostId 為此 post）
      console.log('[RepostService] Unreposting - finding repost post')
      const repostPost = await postRepository.findMany({
        skip: 0,
        take: 1,
        where: {
          authorId: userId,
          originalPostId: postId,
        } as any,
      })

      console.log('[RepostService] Found repost posts:', repostPost.length)

      if (repostPost.length > 0) {
        console.log('[RepostService] Deleting repost post:', repostPost[0].id)
        await postRepository.delete(repostPost[0].id)
      }

      console.log('[RepostService] Deleting repost record')
      await repostRepository.delete(postId, null, userId)
      console.log('[RepostService] Unrepost successful')
      return { reposted: false }
    } else {
      // 創建 repost - 創建新的 post 和 repost 記錄
      // 創建 repost post（內容為空，因為是純 repost）
      console.log('[RepostService] Creating repost post')
      const repostPost = await postRepository.create({
        content: '',
        authorId: userId,
        originalPostId: postId,
      })

      console.log('[RepostService] Repost post created:', repostPost.id)

      // 創建 repost 記錄
      console.log('[RepostService] Creating repost record')
      await repostRepository.create({
        postId,
        commentId: null,
        userId,
      })

      console.log('[RepostService] Repost successful')
      return { reposted: true, repostPostId: repostPost.id }
    }
  }

  async toggleCommentRepost(commentId: string, userId: string) {
    console.log('[RepostService] toggleCommentRepost called:', { commentId, userId })
    
    // 檢查留言是否存在
    const comment = await commentRepository.findById(commentId)
    if (!comment) {
      console.error('[RepostService] Comment not found:', commentId)
      throw new Error('Comment not found')
    }

    console.log('[RepostService] Comment found:', comment.id)

    // 檢查是否已經 repost
    const existingRepost = await repostRepository.findUnique(null, commentId, userId)
    console.log('[RepostService] Existing repost check:', { found: !!existingRepost })

    if (existingRepost) {
      // 取消 repost - 刪除 repost 記錄和 repost post
      // 先找到 repost post（由該用戶創建的，且 originalCommentId 為此 comment）
      console.log('[RepostService] Unreposting - finding repost post')
      const repostPost = await postRepository.findMany({
        skip: 0,
        take: 1,
        where: {
          authorId: userId,
          originalCommentId: commentId,
        } as any,
      })

      console.log('[RepostService] Found repost posts:', repostPost.length)

      if (repostPost.length > 0) {
        console.log('[RepostService] Deleting repost post:', repostPost[0].id)
        await postRepository.delete(repostPost[0].id)
      }

      console.log('[RepostService] Deleting repost record')
      await repostRepository.delete(null, commentId, userId)
      console.log('[RepostService] Unrepost successful')
      return { reposted: false }
    } else {
      // 創建 repost - 創建新的 post 和 repost 記錄
      // 創建 repost post（內容為空，originalCommentId 為 commentId）
      console.log('[RepostService] Creating repost post')
      const repostPost = await postRepository.create({
        content: '',
        authorId: userId,
        originalCommentId: commentId,
      })

      console.log('[RepostService] Repost post created:', repostPost.id)

      // 創建 repost 記錄
      console.log('[RepostService] Creating repost record')
      await repostRepository.create({
        postId: null,
        commentId,
        userId,
      })

      console.log('[RepostService] Repost successful')
      return { reposted: true, repostPostId: repostPost.id }
    }
  }

  async getRepostStatus(postId: string, userId: string) {
    const repost = await repostRepository.findUnique(postId, null, userId)
    return { reposted: !!repost }
  }

  async getCommentRepostStatus(commentId: string, userId: string) {
    const repost = await repostRepository.findUnique(null, commentId, userId)
    return { reposted: !!repost }
  }

  async getRepostCount(postId: string) {
    const count = await repostRepository.countByPost(postId)
    return { count }
  }

  async getCommentRepostCount(commentId: string) {
    const count = await repostRepository.countByComment(commentId)
    return { count }
  }

  async getUserReposts(userId: string, { page, limit }: { page: number; limit: number }) {
    console.log('[RepostService] getUserReposts called:', { userId, page, limit })
    
    // 直接查詢 repost posts（originalPostId 或 originalCommentId 不為 null 的 posts）
    // userId 是用户的 userId（自定义 ID），需要通过 author.userId 来查询
    const skip = (page - 1) * limit
    
    // 使用 postRepository 查詢 repost posts
    const posts = await postRepository.findMany({
      skip,
      take: limit,
      where: {
        author: {
          userId,
        },
        OR: [
          { originalPostId: { not: null } },
          { originalCommentId: { not: null } },
        ],
      } as any,
    })

    console.log('[RepostService] Found repost posts:', posts.length)

    const total = await postRepository.count({
      author: {
        userId,
      },
      OR: [
        { originalPostId: { not: null } },
        { originalCommentId: { not: null } },
      ],
    } as any)

    console.log('[RepostService] Total repost posts:', total)

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

export const repostService = new RepostService()

