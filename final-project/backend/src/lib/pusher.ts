import Pusher from 'pusher';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
  console.warn('[Pusher] Missing Pusher environment variables. Real-time features will be disabled.');
}

export const pusher = process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    })
  : null;

/**
 * Trigger a Pusher event on an event channel
 */
export function triggerEventChannel(eventId: number, eventName: string, data: any): void {
  const channelName = `event-${eventId}`;
  
  console.log('[Pusher] Attempting to trigger event:', {
    channel: channelName,
    event: eventName,
    data,
    timestamp: new Date().toISOString(),
    pusherConfig: {
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY?.substring(0, 10) + '...',
      cluster: process.env.PUSHER_CLUSTER,
    },
  });

  if (!pusher) {
    console.warn(`[Pusher] Pusher not configured. Skipping event: ${eventName} on channel ${channelName}`);
    console.warn('[Pusher] Environment variables:', {
      PUSHER_APP_ID: !!process.env.PUSHER_APP_ID,
      PUSHER_KEY: !!process.env.PUSHER_KEY,
      PUSHER_SECRET: !!process.env.PUSHER_SECRET,
      PUSHER_CLUSTER: process.env.PUSHER_CLUSTER || 'not set',
    });
    return;
  }

  // Use the same format as official example: pusher.trigger("my-channel", "my-event", {...})
  pusher.trigger(channelName, eventName, data)
    .then(() => {
      console.log('[Pusher] ✓ Successfully triggered event:', {
        channel: channelName,
        event: eventName,
        data,
        timestamp: new Date().toISOString(),
      });
    })
    .catch((error) => {
      console.error(`[Pusher] ✗ Error triggering event ${eventName} on channel ${channelName}:`, {
        error: error.message,
        stack: error.stack,
        errorCode: error.code,
        errorStatus: error.status,
        data,
      });
    });
}

/**
 * Trigger a Pusher event on a chat channel (user or group)
 */
export function triggerChatChannel(
  type: 'user' | 'group',
  id: string | number,
  eventName: string,
  data: any
): void {
  const channelName = type === 'user' ? `chat-user-${id}` : `group-${id}`;
  
  // Only log in development to reduce log noise
  if (process.env.NODE_ENV === 'development') {
    console.log('[Pusher] Attempting to trigger chat event:', {
      channel: channelName,
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  if (!pusher) {
    console.warn(`[Pusher] Pusher not configured. Skipping event: ${eventName} on channel ${channelName}`);
    return;
  }

  pusher.trigger(channelName, eventName, data)
    .then(() => {
      // Only log in development to reduce log noise
      if (process.env.NODE_ENV === 'development') {
        console.log('[Pusher] ✓ Successfully triggered chat event:', {
          channel: channelName,
          event: eventName,
          timestamp: new Date().toISOString(),
        });
      }
    })
    .catch((error) => {
      console.error(`[Pusher] ✗ Error triggering chat event ${eventName} on channel ${channelName}:`, {
        error: error.message,
        stack: error.stack,
      });
    });
}

/**
 * Trigger a Pusher event on a notification channel
 */
export function triggerNotificationChannel(userId: string, eventName: string, data: any): void {
  const channelName = `notification-${userId}`;
  
  console.log('[Pusher] Attempting to trigger notification event:', {
    channel: channelName,
    event: eventName,
    data,
    timestamp: new Date().toISOString(),
  });

  if (!pusher) {
    console.warn(`[Pusher] Pusher not configured. Skipping event: ${eventName} on channel ${channelName}`);
    return;
  }

  pusher.trigger(channelName, eventName, data)
    .then(() => {
      console.log('[Pusher] ✓ Successfully triggered notification event:', {
        channel: channelName,
        event: eventName,
        timestamp: new Date().toISOString(),
      });
    })
    .catch((error) => {
      console.error(`[Pusher] ✗ Error triggering notification event ${eventName} on channel ${channelName}:`, {
        error: error.message,
        stack: error.stack,
      });
    });
}

