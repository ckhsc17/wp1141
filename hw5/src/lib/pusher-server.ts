import Pusher from 'pusher'

// Only initialize Pusher if environment variables are provided
export const pusherServer = 
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER || 'us2',
        useTLS: true,
      })
    : null

