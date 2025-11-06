import { NextResponse } from 'next/server'
import { likeService } from '../services/likeService'

export class LikeController {
  async toggleLike(postId: string, userId: string) {
    try {
      const result = await likeService.toggleLike(postId, userId)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to toggle like' },
        { status: error instanceof Error && error.message === 'Post not found' ? 404 : 500 }
      )
    }
  }

  async getLikeStatus(postId: string, userId: string) {
    try {
      const result = await likeService.getLikeStatus(postId, userId)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get like status' },
        { status: 500 }
      )
    }
  }

  async getUserLikedPosts(userId: string, request: Request) {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const result = await likeService.getUserLikedPosts(userId, { page, limit })
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get liked posts' },
        { status: 500 }
      )
    }
  }
}

export const likeController = new LikeController()

