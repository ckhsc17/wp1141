import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { postController } from '@/server/controllers/postController'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return postController.getPosts(request)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return postController.createPost(request, session.user.id)
}

