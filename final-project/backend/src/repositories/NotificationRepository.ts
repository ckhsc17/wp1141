import prisma from '../lib/prisma';
import { NotificationType } from '@prisma/client';

export class NotificationRepository {
  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: any;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data || null,
        read: false,
      },
    });
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, options?: { read?: boolean; limit?: number }) {
    const { read, limit = 50 } = options || {};
    
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(read !== undefined && { read }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Enrich notifications with current status
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        // Check if data is an object and create a copy
        let enrichedData: any = null;
        if (notification.data && typeof notification.data === 'object' && !Array.isArray(notification.data)) {
          enrichedData = { ...notification.data };
        } else {
          enrichedData = notification.data;
        }

        // For FRIEND_REQUEST notifications, add current status
        if (
          notification.type === 'FRIEND_REQUEST' &&
          enrichedData &&
          typeof enrichedData === 'object' &&
          'requestId' in enrichedData
        ) {
          try {
            const request = await prisma.friendRequest.findUnique({
              where: { id: enrichedData.requestId },
              select: { status: true },
            });
            if (request) {
              enrichedData.requestStatus = request.status;
            }
          } catch (error) {
            console.error('Error fetching friend request status:', error);
          }
        }

        // For EVENT_INVITE notifications, add current status
        if (
          notification.type === 'EVENT_INVITE' &&
          enrichedData &&
          typeof enrichedData === 'object' &&
          'invitationId' in enrichedData
        ) {
          try {
            const invitation = await prisma.eventInvitation.findUnique({
              where: { id: enrichedData.invitationId },
              select: { status: true },
            });
            if (invitation) {
              enrichedData.invitationStatus = invitation.status;
            }
          } catch (error) {
            console.error('Error fetching event invitation status:', error);
          }
        }

        return {
          ...notification,
          data: enrichedData,
        };
      })
    );

    return enrichedNotifications;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: number) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number) {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user (excluding NEW_MESSAGE notifications)
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
        type: {
          not: 'NEW_MESSAGE', // Don't mark chat messages as read
        },
      },
      data: {
        read: true,
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: number) {
    return prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Get unread count for a user (excluding NEW_MESSAGE notifications)
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
        type: {
          not: 'NEW_MESSAGE', // Exclude chat messages from notification count
        },
      },
    });
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async deleteOldReadNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }
}

export const notificationRepository = new NotificationRepository();

