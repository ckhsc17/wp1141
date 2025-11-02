import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher-server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !pusherServer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const socketId = formData.get('socket_id') as string
    const channelName = formData.get('channel_name') as string

    // Verify that the user is only subscribing to their own channel
    const expectedChannel = `private-user-${(session.user as any).userId}`
    if (channelName !== expectedChannel) {
      console.log('[Pusher Auth] Channel name mismatch:', { channelName, expectedChannel })
      return NextResponse.json({ error: 'Unauthorized channel' }, { status: 401 })
    }

    console.log('[Pusher Auth] Authenticating user for channel:', {
      userId: session.user.id,
      channelName,
      socketId,
    })

    const auth = pusherServer.authorizeChannel(socketId, channelName)

    return NextResponse.json(auth)
  } catch (error) {
    console.error('[Pusher Auth] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

