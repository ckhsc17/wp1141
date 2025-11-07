import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { postController } from '@/server/controllers/postController'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const viewerId = session?.user?.id

  return postController.getExplorePosts(request, viewerId)
}

