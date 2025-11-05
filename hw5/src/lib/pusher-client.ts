import Pusher from 'pusher-js'

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap3'

// Only initialize Pusher if environment variables are provided
// 根據 Pusher 官方文檔：https://pusher.com/docs/channels/using_channels/client-api/
const pusherClient = PUSHER_KEY
  ? (() => {
      const client = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        authEndpoint: '/api/pusher/auth',
        enabledTransports: ['ws', 'wss'],
        forceTLS: true,
      })

      // 監聽連接錯誤
      client.connection.bind('error', (error: any) => {
        console.error('[Pusher Client] Connection error:', error)
      })

      return client
    })()
  : null

export default pusherClient

