import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { notificationService } from '../services/notificationService'

export class NotificationController {
  async getNotifications(userId: string, request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      console.log('[NotificationController] getNotifications called:', { userId, page, limit })
      const result = await notificationService.getUserNotifications(userId, { page, limit })
      console.log('[NotificationController] getNotifications success:', { count: result.notifications.length })
      return NextResponse.json(result)
    } catch (error) {
      console.error('[NotificationController] getNotifications error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get notifications' },
        { status: 500 }
      )
    }
  }

  async getUnreadCount(userId: string) {
    try {
      console.log('[NotificationController] getUnreadCount called:', { userId })
      const count = await notificationService.getUnreadCount(userId)
      console.log('[NotificationController] getUnreadCount success:', { count })
      return NextResponse.json({ count })
    } catch (error) {
      console.error('[NotificationController] getUnreadCount error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get unread count' },
        { status: 500 }
      )
    }
  }
}

export const notificationController = new NotificationController()

