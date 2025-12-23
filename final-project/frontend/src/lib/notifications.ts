/**
 * Browser Notifications Utility
 * Handles browser notification permissions and display
 */

/**
 * Request notification permission from user
 * @returns Promise resolving to permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    console.log('[Notifications] Notification permission granted');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('[Notifications] Notification permission denied by user');
    return 'denied';
  }

  // Permission is 'default', request it
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('[Notifications] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Check if notifications are supported and permitted
 */
export function canShowNotifications(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Show a notification
 * @param title Notification title
 * @param options Notification options
 * @returns Notification instance or null if not permitted
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  console.log('[Notifications] showNotification called:', {
    title,
    options,
    permission: Notification.permission,
    canShow: canShowNotifications(),
  });

  if (!canShowNotifications()) {
    console.warn('[Notifications] Cannot show notification: permission not granted', {
      permission: Notification.permission,
      isSupported: 'Notification' in window,
    });
    return null;
  }

  try {
    const notificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    };

    console.log('[Notifications] Creating notification with options:', notificationOptions);

    const notification = new Notification(title, notificationOptions);

    console.log('[Notifications] Notification created:', {
      title: notification.title,
      body: notification.body,
      tag: notification.tag,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
      console.log('[Notifications] Notification auto-closed after 5 seconds');
    }, 5000);

    // Handle click event
    notification.onclick = () => {
      console.log('[Notifications] Notification clicked');
      window.focus();
      notification.close();
    };

    // Handle show event
    notification.onshow = () => {
      console.log('[Notifications] ✓ Notification displayed');
    };

    // Handle error event
    notification.onerror = (error) => {
      console.error('[Notifications] Notification error:', error);
    };

    // Handle close event
    notification.onclose = () => {
      console.log('[Notifications] Notification closed');
    };

    return notification;
  } catch (error) {
    console.error('[Notifications] Error showing notification:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Show a poke notification
 * @param fromNickname Name of the person who poked
 * @param count Number of times poked
 */
export function showPokeNotification(fromNickname: string, count: number): void {
  console.log('[Notifications] showPokeNotification called:', {
    fromNickname,
    count,
    permission: Notification.permission,
    canShow: canShowNotifications(),
    isSupported: 'Notification' in window,
  });

  const title = '有人戳了你！';
  const body = count > 1 
    ? `${fromNickname} 戳了你 (${count} 次)`
    : `${fromNickname} 戳了你`;

  const result = showNotification(title, {
    body,
    tag: 'poke-notification', // Use tag to replace previous notifications
    requireInteraction: false,
  });

  if (result) {
    console.log('[Notifications] ✓ Notification shown successfully');
  } else {
    console.warn('[Notifications] ✗ Failed to show notification - check permission status');
  }
}

