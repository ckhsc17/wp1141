import Pusher from 'pusher'

// Only initialize Pusher if environment variables are provided
// 根據 Pusher 官方文檔：https://pusher.com/docs/channels/server_api/using-channels/
export const pusherServer = 
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET
    ? (() => {
        const config = {
          appId: process.env.PUSHER_APP_ID,
          key: process.env.PUSHER_KEY,
          secret: process.env.PUSHER_SECRET,
          cluster: process.env.PUSHER_CLUSTER || 'ap3',
          useTLS: true,
        }
        
        console.log('[Pusher Server] Initializing Pusher server:', {
          appId: config.appId,
          key: config.key.substring(0, 8) + '...',
          secret: config.secret.substring(0, 8) + '...',
          cluster: config.cluster,
          useTLS: config.useTLS,
        })
        
        const server = new Pusher(config)
        
        console.log('[Pusher Server] Pusher server initialized successfully')
        return server
      })()
    : (() => {
        console.warn('[Pusher Server] Pusher credentials not configured:', {
          hasAppId: !!process.env.PUSHER_APP_ID,
          hasKey: !!process.env.PUSHER_KEY,
          hasSecret: !!process.env.PUSHER_SECRET,
        })
        return null
      })()

