import api from './axios';
import { Notification } from '../types/notification';

export const notificationsApi = {
  // Get notifications
  getNotifications: async (params?: {
    read?: boolean;
    limit?: number;
  }): Promise<{ notifications: Notification[] }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: number): Promise<{ success: boolean }> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
};

