import { NextRequest } from 'next/server'
import { postController } from '@/server/controllers/postController'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  return postController.getUserPosts(userId, request)
}

