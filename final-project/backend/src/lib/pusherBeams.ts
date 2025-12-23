/**
 * Pusher Beams Server SDK
 * Handles sending push notifications via Pusher Beams
 */

import PushNotifications from '@pusher/push-notifications-server';

let beamsClient: PushNotifications | null = null;

/**
 * Get frontend origin URL (same logic as auth.ts)
 */
function getFrontendOrigin(): string {
  // Priority: FRONTEND_ORIGIN > VERCEL_URL (for preview deployments) > localhost
  if (process.env.FRONTEND_ORIGIN) {
    return process.env.FRONTEND_ORIGIN;
  }
  // In production/Vercel, try to infer frontend URL from backend URL
  if (process.env.VERCEL_URL) {
    // If backend is on Vercel, frontend might be on same domain or different subdomain
    // This is a fallback - should set FRONTEND_ORIGIN explicitly
    console.warn('[PusherBeams] FRONTEND_ORIGIN not set, using VERCEL_URL fallback');
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:5173';
}

/**
 * Initialize Pusher Beams client
 */
function getBeamsClient(): PushNotifications | null {
  if (beamsClient) {
    return beamsClient;
  }

  const instanceId = process.env.PUSHER_BEAMS_INSTANCE_ID;
  const secretKey = process.env.PUSHER_BEAMS_SECRET_KEY;

  if (!instanceId || !secretKey) {
    console.warn('[PusherBeams] Missing environment variables:', {
      hasInstanceId: !!instanceId,
      hasSecretKey: !!secretKey,
    });
    return null;
  }

  try {
    beamsClient = new PushNotifications({
      instanceId,
      secretKey,
    });
    console.log('[PusherBeams] Client initialized successfully');
    return beamsClient;
  } catch (error) {
    console.error('[PusherBeams] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Send push notification to a device interest
 * @param interest Device interest (e.g., "event-123-member-456" or "user-789")
 * @param title Notification title
 * @param body Notification body
 * @param data Additional data to pass with notification
 */
export async function sendPushNotification(
  interest: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  const client = getBeamsClient();
  if (!client) {
    console.warn('[PusherBeams] Cannot send notification: client not initialized');
    return false;
  }

  try {
    // Get frontend origin to build full URLs
    const frontendOrigin = getFrontendOrigin();
    
    // Build deep_link URL from data (must be full URI)
    const deepLinkPath = data?.url || (data?.eventId ? `/events/${data.eventId}` : '/');
    const deepLink = deepLinkPath.startsWith('http') 
      ? deepLinkPath 
      : `${frontendOrigin}${deepLinkPath}`;
    
    // Build icon URL (must be full URI)
    const iconPath = '/favicon.ico';
    const iconUrl = iconPath.startsWith('http') 
      ? iconPath 
      : `${frontendOrigin}${iconPath}`;
    
    const payload = {
      web: {
        notification: {
          title,
          body,
          icon: iconUrl,
          deep_link: deepLink,
        },
        data: {
          ...data,
          // Ensure eventId and url are included in data for notification click handling
          eventId: data?.eventId || '',
          url: deepLinkPath, // Keep relative path in data for frontend use
        },
      },
    };

    await client.publishToInterests([interest], payload);
    console.log('[PusherBeams] Successfully sent notification:', {
      interest,
      title,
      body,
    });
    return true;
  } catch (error) {
    console.error('[PusherBeams] Failed to send notification:', {
      error,
      interest,
      title,
    });
    return false;
  }
}

/**
 * Send push notification to multiple interests
 */
export async function sendPushNotificationToInterests(
  interests: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  const client = getBeamsClient();
  if (!client) {
    console.warn('[PusherBeams] Cannot send notification: client not initialized');
    return false;
  }

  if (interests.length === 0) {
    console.warn('[PusherBeams] No interests provided');
    return false;
  }

  try {
    // Get frontend origin to build full URLs
    const frontendOrigin = getFrontendOrigin();
    
    // Build deep_link URL from data (must be full URI)
    const deepLinkPath = data?.url || (data?.eventId ? `/events/${data.eventId}` : '/');
    const deepLink = deepLinkPath.startsWith('http') 
      ? deepLinkPath 
      : `${frontendOrigin}${deepLinkPath}`;
    
    // Build icon URL (must be full URI)
    const iconPath = '/favicon.ico';
    const iconUrl = iconPath.startsWith('http') 
      ? iconPath 
      : `${frontendOrigin}${iconPath}`;
    
    const payload = {
      web: {
        notification: {
          title,
          body,
          icon: iconUrl,
          deep_link: deepLink,
        },
        data: {
          ...data,
          // Ensure eventId and url are included in data for notification click handling
          eventId: data?.eventId || '',
          url: deepLinkPath, // Keep relative path in data for frontend use
        },
      },
    };

    await client.publishToInterests(interests, payload);
    console.log('[PusherBeams] Successfully sent notification to multiple interests:', {
      interests,
      title,
      body,
    });
    return true;
  } catch (error) {
    console.error('[PusherBeams] Failed to send notification:', {
      error,
      interests,
      title,
    });
    return false;
  }
}

