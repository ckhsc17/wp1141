import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { postController } from '@/server/controllers/postController'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return postController.getPosts(request)
}

export async function POST(request: NextRequest) {
  console.log('[API Route] /api/posts POST request received')
  
  const session = await getServerSession(authOptions)
  console.log('[API Route] Session check:', {
    hasSession: !!session,
    hasUserId: !!session?.user?.id,
    userId: session?.user?.id,
    userUserId: (session?.user as any)?.userId,
  })
  
  if (!session?.user?.id) {
    console.warn('[API Route] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[API Route] Calling postController.createPost')
  return postController.createPost(request, session.user.id)
}

