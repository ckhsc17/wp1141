import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { repostController } from '@/server/controllers/repostController'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API Route] /api/comments/[id]/repost POST request received')
  
  const session = await getServerSession(authOptions)
  console.log('[API Route] Session check:', {
    hasSession: !!session,
    hasUserId: !!session?.user?.id,
    userId: session?.user?.id,
  })
  
  if (!session?.user?.id) {
    console.warn('[API Route] Unauthorized request to /api/comments/[id]/repost')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  console.log('[API Route] Calling repostController.toggleCommentRepost with commentId:', id)
  return repostController.toggleCommentRepost(id, session.user.id)
}

