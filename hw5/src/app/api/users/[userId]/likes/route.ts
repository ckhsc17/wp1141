import { NextRequest, NextResponse } from 'next/server'
import { likeController } from '@/server/controllers/likeController'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionUserId = (session.user as any)?.userId
  if (!sessionUserId || sessionUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return likeController.getUserLikedPosts(userId, request)
}

