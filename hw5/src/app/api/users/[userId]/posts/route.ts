import { NextRequest } from 'next/server'
import { postController } from '@/server/controllers/postController'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return postController.getUserPosts(params.userId, request)
}

