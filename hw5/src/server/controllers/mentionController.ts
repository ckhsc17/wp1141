import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { mentionService } from '../services/mentionService'

export class MentionController {
  async getMentions(currentUserId: string, request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const result = await mentionService.getUserMentions(currentUserId, { page, limit })
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get mentions' },
        { status: 500 }
      )
    }
  }

  async markAsRead(mentionId: string, currentUserId: string) {
    try {
      const result = await mentionService.markAsRead(mentionId, currentUserId)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to mark mention as read' },
        { status: 400 }
      )
    }
  }

  async markAllAsRead(currentUserId: string) {
    try {
      const result = await mentionService.markAllAsRead(currentUserId)
      return NextResponse.json({ success: true, count: result.count })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to mark all as read' },
        { status: 500 }
      )
    }
  }

  async getUnreadCount(currentUserId: string) {
    try {
      const count = await mentionService.getUnreadCount(currentUserId)
      return NextResponse.json({ count })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get unread count' },
        { status: 500 }
      )
    }
  }
}

export const mentionController = new MentionController()



