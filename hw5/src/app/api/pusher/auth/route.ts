import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher-server'

/**
 * Pusher Private Channel Authentication Endpoint
 * 
 * 根據 Pusher 官方文檔：
 * https://pusher.com/docs/channels/server_api/authorizing-users/
 * 
 * Pusher 會發送 POST 請求到此端點，包含：
 * - socket_id: WebSocket 連接 ID
 * - channel_name: 要訂閱的頻道名稱（例如：private-user-123）
 * 
 * 格式：application/x-www-form-urlencoded
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[Pusher Auth] ===== AUTH REQUEST RECEIVED =====')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[Pusher Auth] Session check:', {
      hasSession: !!session,
      hasUserId: !!session?.user?.id,
      hasPusherServer: !!pusherServer,
      userId: session?.user?.id,
      userUserId: (session?.user as any)?.userId,
    })

    if (!session?.user?.id || !pusherServer) {
      console.warn('[Pusher Auth] Unauthorized - missing session or pusher server')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      )
    }

    // Pusher 發送的是 application/x-www-form-urlencoded 格式
    const formData = await request.formData()
    const socketId = formData.get('socket_id') as string
    const channelName = formData.get('channel_name') as string

    console.log('[Pusher Auth] Request parameters:', {
      socketId,
      channelName,
      hasSocketId: !!socketId,
      hasChannelName: !!channelName,
    })

    if (!socketId || !channelName) {
      console.error('[Pusher Auth] Missing required parameters')
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      )
    }

    // 驗證用戶只能訂閱自己的頻道
    const expectedChannel = `private-user-${(session.user as any).userId}`
    console.log('[Pusher Auth] Channel validation:', {
      requestedChannel: channelName,
      expectedChannel,
      match: channelName === expectedChannel,
      userUserId: (session.user as any).userId,
    })
    
    if (channelName !== expectedChannel) {
      console.warn('[Pusher Auth] ❌ Channel name mismatch:', {
        channelName,
        expectedChannel,
        userId: session.user.id,
        userUserId: (session.user as any).userId,
      })
      return NextResponse.json(
        { error: 'Unauthorized channel' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      )
    }

    console.log('[Pusher Auth] Authenticating user for channel:', {
      userId: session.user.id,
      userIdFromSession: (session.user as any).userId,
      channelName,
      socketId,
    })

    // authorizeChannel 返回格式：{ auth: "APP_KEY:signature" }
    const auth = pusherServer.authorizeChannel(socketId, channelName)
    
    const duration = Date.now() - startTime
    console.log('[Pusher Auth] ✅ Authentication successful:', {
      channelName,
      socketId,
      authKeyLength: auth.auth?.length || 0,
      duration: `${duration}ms`,
    })
    console.log('[Pusher Auth] ===== AUTH REQUEST COMPLETED =====')

    return NextResponse.json(auth, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[Pusher Auth] ❌ Error during authentication:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    })
    console.error('[Pusher Auth] ===== AUTH REQUEST FAILED =====')
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    )
  }
}

// 處理 CORS preflight 請求
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      },
    }
  )
}

