import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationController } from '@/server/controllers/notificationController'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  console.log('[Notifications API] GET called:', {
    hasSession: !!session,
    hasUserId: !!session?.user?.id,
    userId: session?.user?.id,
  })
  
  if (!session?.user?.id) {
    console.warn('[Notifications API] No session, returning empty notifications')
    // 回傳空通知列表而不是 401，避免前端錯誤
    return NextResponse.json({
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    })
  }

  return notificationController.getNotifications(session.user.id, request)
}

export async function PUT() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return notificationController.markAllAsRead(session.user.id)
}

