import Pusher from 'pusher-js'

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap3'

// Only initialize Pusher if environment variables are provided
// 根據 Pusher 官方文檔：https://pusher.com/docs/channels/using_channels/client-api/
const pusherClient = PUSHER_KEY
  ? new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      // 對於 private/presence channels，需要設置認證端點
      authEndpoint: '/api/pusher/auth',
      // Pusher 會自動發送 cookies，不需要手動設置 headers
      // 認證端點會自動接收 formData 格式的請求
      enabledTransports: ['ws', 'wss'],
      forceTLS: true,
    })
  : null

export default pusherClient

