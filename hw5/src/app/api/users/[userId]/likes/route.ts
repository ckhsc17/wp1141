import { NextRequest } from 'next/server'
import { likeController } from '@/server/controllers/likeController'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  return likeController.getUserLikedPosts(userId, request)
}

