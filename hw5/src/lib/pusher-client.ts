import Pusher from 'pusher-js'

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2'

// Only initialize Pusher if environment variables are provided
const pusherClient = PUSHER_KEY
  ? new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    })
  : null

export default pusherClient

