/**
 * Pusher Beams Client Management
 * Handles Service Worker registration and Push Notification subscriptions
 */

import * as PusherPushNotifications from '@pusher/push-notifications-web';

// Get instance ID from environment variable
const getInstanceId = (): string => {
  const instanceId = import.meta.env.VITE_PUSHER_BEAMS_INSTANCE_ID;
  if (!instanceId) {
    console.warn('[PusherBeams] VITE_PUSHER_BEAMS_INSTANCE_ID not set');
    return '';
  }
  return instanceId;
};

let beamsClient: PusherPushNotifications.Client | null = null;
let isInitialized = false;

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PusherBeams] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    console.log('[PusherBeams] Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('[PusherBeams] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Initialize Pusher Beams Client
 */
export async function initializeBeamsClient(): Promise<PusherPushNotifications.Client | null> {
  if (isInitialized && beamsClient) {
    // Verify client is still started
    try {
      // Check if client is ready by trying to get device ID (this will throw if not started)
      await beamsClient.getDeviceId();
      return beamsClient;
    } catch (error) {
      // Client was initialized but not started, reset and reinitialize
      console.warn('[PusherBeams] Client was initialized but not started, reinitializing...');
      beamsClient = null;
      isInitialized = false;
    }
  }

  const instanceId = getInstanceId();
  if (!instanceId) {
    console.error('[PusherBeams] Cannot initialize: instanceId not set');
    return null;
  }

  // Register Service Worker first
  const registration = await registerServiceWorker();
  if (!registration) {
    console.error('[PusherBeams] Cannot initialize: Service Worker registration failed');
    return null;
  }

  // Wait a bit for Service Worker to be ready
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    beamsClient = new PusherPushNotifications.Client({
      instanceId,
    });

    // Start the client and wait for it to complete
    await beamsClient.start();
    
    // Verify client is started by getting device ID
    const deviceId = await beamsClient.getDeviceId();
    console.log('[PusherBeams] Client initialized successfully, device ID:', deviceId);
    
    isInitialized = true;
    return beamsClient;
  } catch (error) {
    console.error('[PusherBeams] Failed to initialize client:', error);
    beamsClient = null;
    isInitialized = false;
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PusherBeams] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('[PusherBeams] Notification permission denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('[PusherBeams] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Subscribe to a Device Interest
 */
export async function subscribeToInterest(interest: string): Promise<boolean> {
  try {
    // Check permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[PusherBeams] Cannot subscribe: permission not granted');
      return false;
    }

    // Initialize and ensure client is started
    const client = await initializeBeamsClient();
    if (!client) {
      console.error('[PusherBeams] Cannot subscribe: client not initialized');
      return false;
    }

    // Verify client is started with retry logic
    let retries = 5;
    let isStarted = false;
    
    while (retries > 0 && !isStarted) {
      try {
        await client.getDeviceId();
        isStarted = true;
        console.log('[PusherBeams] Client is started and ready');
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`[PusherBeams] Client not started yet, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          console.error('[PusherBeams] Client not started after retries, cannot subscribe:', error);
          return false;
        }
      }
    }

    if (!isStarted) {
      return false;
    }

    // Add a small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    await client.addDeviceInterest(interest);
    console.log('[PusherBeams] Successfully subscribed to interest:', interest);
    return true;
  } catch (error) {
    console.error('[PusherBeams] Failed to subscribe to interest:', error);
    return false;
  }
}

/**
 * Unsubscribe from a Device Interest
 */
export async function unsubscribeFromInterest(interest: string): Promise<boolean> {
  try {
    if (!beamsClient) {
      console.warn('[PusherBeams] Cannot unsubscribe: client not initialized');
      return false;
    }

    await beamsClient.removeDeviceInterest(interest);
    console.log('[PusherBeams] Successfully unsubscribed from interest:', interest);
    return true;
  } catch (error) {
    console.error('[PusherBeams] Failed to unsubscribe from interest:', error);
    return false;
  }
}

/**
 * Get all subscribed interests
 */
export async function getSubscribedInterests(): Promise<string[]> {
  try {
    if (!beamsClient) {
      return [];
    }

    const interests = await beamsClient.getDeviceInterests();
    return interests;
  } catch (error) {
    console.error('[PusherBeams] Failed to get interests:', error);
    return [];
  }
}

/**
 * Clear all device interests
 */
export async function clearAllInterests(): Promise<boolean> {
  try {
    if (!beamsClient) {
      return false;
    }

    await beamsClient.clearDeviceInterests();
    console.log('[PusherBeams] Cleared all interests');
    return true;
  } catch (error) {
    console.error('[PusherBeams] Failed to clear interests:', error);
    return false;
  }
}

/**
 * Stop Beams client
 */
export async function stopBeamsClient(): Promise<void> {
  try {
    if (beamsClient) {
      await beamsClient.stop();
      beamsClient = null;
      isInitialized = false;
      console.log('[PusherBeams] Client stopped');
    }
  } catch (error) {
    console.error('[PusherBeams] Failed to stop client:', error);
  }
}

