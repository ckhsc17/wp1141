import Pusher from 'pusher-js'

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap3'

// Only initialize Pusher if environment variables are provided
// 根據 Pusher 官方文檔：https://pusher.com/docs/channels/using_channels/client-api/
const pusherClient = PUSHER_KEY
  ? (() => {
      console.log('[Pusher Client] Initializing Pusher client:', {
        key: PUSHER_KEY.substring(0, 8) + '...',
        cluster: PUSHER_CLUSTER,
        authEndpoint: '/api/pusher/auth',
      })
      
      const client = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        authEndpoint: '/api/pusher/auth',
        enabledTransports: ['ws', 'wss'],
        forceTLS: true,
      })

      // 監聽連接事件
      client.connection.bind('connecting', () => {
        console.log('[Pusher Client] Connecting to Pusher...')
      })

      client.connection.bind('connected', () => {
        console.log('[Pusher Client] ✅ Connected to Pusher successfully')
      })

      client.connection.bind('disconnected', () => {
        console.log('[Pusher Client] Disconnected from Pusher')
      })

      client.connection.bind('error', (error: any) => {
        console.error('[Pusher Client] ❌ Connection error:', error)
      })

      client.connection.bind('state_change', (states: { previous: string; current: string }) => {
        console.log('[Pusher Client] Connection state changed:', {
          previous: states.previous,
          current: states.current,
        })
      })

      console.log('[Pusher Client] Pusher client initialized')
      return client
    })()
  : (() => {
      console.warn('[Pusher Client] Pusher key not configured')
      return null
    })()

export default pusherClient

