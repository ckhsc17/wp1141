import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { repostController } from '@/server/controllers/repostController'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API Route] /api/posts/[id]/repost POST request received')
  
  const session = await getServerSession(authOptions)
  console.log('[API Route] Session check:', {
    hasSession: !!session,
    hasUserId: !!session?.user?.id,
    userId: session?.user?.id,
  })
  
  if (!session?.user?.id) {
    console.warn('[API Route] Unauthorized request to /api/posts/[id]/repost')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  console.log('[API Route] Calling repostController.toggleRepost with postId:', id)
  return repostController.toggleRepost(id, session.user.id)
}

