import { notificationRepository } from '../repositories/NotificationRepository';
import { NotificationType } from '@prisma/client';
import { triggerNotificationChannel } from '../lib/pusher';
import { sendPushNotification } from '../lib/pusherBeams';

export class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: any;
    sendPush?: boolean;
  }) {
    const { sendPush = true, ...notificationData } = data;
    
    const notification = await notificationRepository.createNotification(notificationData);

    // Trigger real-time notification
    triggerNotificationChannel(data.userId, 'new-notification', notification);

    // Send push notification if requested
    if (sendPush) {
      await this.sendPushForNotification(notification);
    }

    return notification;
  }

  /**
   * Send push notification based on notification type
   */
  private async sendPushForNotification(notification: any) {
    let url = '/notifications';
    
    // Determine URL based on notification type
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        url = '/notifications';
        break;
      case 'FRIEND_ACCEPTED':
        url = '/friends';
        break;
      case 'NEW_MESSAGE':
        if (notification.data?.groupId) {
          url = `/chat/group/${notification.data.groupId}`;
        } else if (notification.data?.senderId) {
          url = `/chat/user/${notification.data.senderId}`;
        }
        break;
      case 'EVENT_INVITE':
        if (notification.data?.eventId) {
          url = `/events/${notification.data.eventId}`;
        }
        break;
      case 'POKE':
        if (notification.data?.eventId) {
          url = `/events/${notification.data.eventId}`;
        }
        break;
      case 'EVENT_UPDATE':
        if (notification.data?.eventId) {
          url = `/events/${notification.data.eventId}`;
        }
        break;
      default:
        url = '/notifications';
    }

    await sendPushNotification(
      `user-${notification.userId}`,
      notification.title,
      notification.body,
      {
        url,
        type: notification.type,
        ...notification.data,
      }
    );
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, options?: { read?: boolean; limit?: number }) {
    return notificationRepository.getNotifications(userId, options);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: string) {
    const notification = await notificationRepository.getNotificationById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number, userId: string) {
    const notification = await notificationRepository.getNotificationById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return notificationRepository.deleteNotification(notificationId);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    return notificationRepository.getUnreadCount(userId);
  }
}

export const notificationService = new NotificationService();

