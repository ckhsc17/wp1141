import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { postController } from '@/server/controllers/postController'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions)
  const { userId } = await params
  return postController.getUserPosts(userId, request, session?.user?.id)
}

