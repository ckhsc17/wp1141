import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { Notification } from '../types/notification';
import { usePusher } from './usePusher';

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  // Query for notifications list
  const {
    data: notifications = [],
    isLoading: loading,
    error,
    refetch: loadNotifications,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { notifications: data } = await notificationsApi.getNotifications({ limit: 100 });
      return data;
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 seconds
  });

  // Query for unread count
  const {
    data: unreadCount = 0,
    refetch: loadUnreadCount,
  } = useQuery<number>({
    queryKey: ['notificationUnreadCount', userId],
    queryFn: async () => {
      const { count } = await notificationsApi.getUnreadCount();
      return count;
    },
    enabled: !!userId,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // Mutation for marking notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await notificationsApi.markAsRead(notificationId);
      return notificationId;
    },
    onSuccess: (notificationId) => {
      // Update notification in cache
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old = []) => {
        return old.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      });
      
      // Update unread count (only if it wasn't a NEW_MESSAGE notification)
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old = []) => {
        const notification = old.find((n) => n.id === notificationId);
        if (notification && !notification.read && notification.type !== 'NEW_MESSAGE') {
          queryClient.setQueryData<number>(['notificationUnreadCount', userId], (count = 0) =>
            Math.max(0, count - 1)
          );
        }
        return old;
      });
    },
  });

  // Mutation for marking all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await notificationsApi.markAllAsRead();
    },
    onSuccess: () => {
      // Update all notifications to read
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old = []) =>
        old.map((n) => ({ ...n, read: true }))
      );
      // Reset unread count
      queryClient.setQueryData<number>(['notificationUnreadCount', userId], 0);
    },
  });

  // Mutation for deleting notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await notificationsApi.deleteNotification(notificationId);
      return notificationId;
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      
      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications', userId]);
      
      // Optimistically remove notification
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old = []) =>
        old.filter((n) => n.id !== notificationId)
      );
      
      // Update unread count if needed
      const notification = previousNotifications?.find((n) => n.id === notificationId);
      if (notification && !notification.read && notification.type !== 'NEW_MESSAGE') {
        queryClient.setQueryData<number>(['notificationUnreadCount', userId], (count = 0) =>
          Math.max(0, count - 1)
        );
      }
      
      return { previousNotifications };
    },
    onError: (_err, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', userId], context.previousNotifications);
      }
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount', userId] });
    },
  });

  // Set up Pusher for real-time notifications
  usePusher({
    channelName: userId ? `notification-${userId}` : null,
    eventName: 'new-notification',
    onEvent: (data: Notification) => {
      console.log('[useNotifications] New notification received:', data);
      
      // Add new notification to cache
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old = []) => {
        // Check if already exists
        if (old.some((n) => n.id === data.id)) {
          return old;
        }
        return [data, ...old];
      });
      
      // Update unread count (only if it's not a NEW_MESSAGE notification)
      if (data.type !== 'NEW_MESSAGE') {
        queryClient.setQueryData<number>(['notificationUnreadCount', userId], (count = 0) => count + 1);
      }
    },
  });

  // Listen for friend request events
  usePusher({
    channelName: userId ? `notification-${userId}` : null,
    eventName: 'friend-request',
    onEvent: (data: any) => {
      console.log('[useNotifications] Friend request received:', data);
      if (data.notification) {
        queryClient.setQueryData<Notification[]>(['notifications', userId], (old = []) => {
          if (old.some((n) => n.id === data.notification.id)) {
            return old;
          }
          return [data.notification, ...old];
        });
        
        if (data.notification.type !== 'NEW_MESSAGE') {
          queryClient.setQueryData<number>(['notificationUnreadCount', userId], (count = 0) => count + 1);
        }
      }
    },
  });

  // Listen for friend accepted events
  usePusher({
    channelName: userId ? `notification-${userId}` : null,
    eventName: 'friend-accepted',
    onEvent: (data: any) => {
      console.log('[useNotifications] Friend accepted:', data);
      if (data.notification) {
        queryClient.setQueryData<Notification[]>(['notifications', userId], (old = []) => {
          if (old.some((n) => n.id === data.notification.id)) {
            return old;
          }
          return [data.notification, ...old];
        });
        
        if (data.notification.type !== 'NEW_MESSAGE') {
          queryClient.setQueryData<number>(['notificationUnreadCount', userId], (count = 0) => count + 1);
        }
      }
    },
  });

  return {
    notifications,
    unreadCount,
    loading,
    error: error as Error | null,
    loadNotifications,
    loadUnreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
  };
}
