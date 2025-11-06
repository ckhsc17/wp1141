'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import axios from 'axios'
import { Notification, PaginatedResponse } from '@/types'
import pusherClient from '@/lib/pusher-client'

export function useNotifications(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: async () => {
      try {
        const { data } = await axios.get('/api/notifications', {
          params: { page, limit },
        })
        console.log('[useNotifications] API response:', data)
        // API 返回的是 { notifications, pagination }，需要转换为 PaginatedResponse 格式
        return {
          data: data.notifications || [],
          pagination: data.pagination || { page, limit, total: 0, totalPages: 0 },
        } as PaginatedResponse<Notification>
      } catch (error) {
        console.error('[useNotifications] Error fetching notifications:', error)
        throw error
      }
    },
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const { data } = await axios.get<{ count: number }>('/api/notifications/unread')
      return data.count
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

/**
 * Hook to listen for Pusher notification events
 */
export function usePusherNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    console.log('[usePusherNotifications] Hook called:', {
      userId,
      hasClient: !!pusherClient,
      connectionState: pusherClient?.connection?.state,
    })
    
    if (!userId || !pusherClient) {
      console.log('[usePusherNotifications] Missing userId or pusherClient, skipping subscription')
      return
    }

    const channelName = `private-user-${userId}`
    console.log('[usePusherNotifications] Subscribing to channel:', channelName)

    // 檢查 Pusher 連接狀態
    if (pusherClient.connection.state === 'disconnected') {
      console.log('[usePusherNotifications] Pusher disconnected, attempting to connect...')
      pusherClient.connect()
    }

    // 訂閱頻道
    const channel = pusherClient.subscribe(channelName)
    console.log('[usePusherNotifications] Channel subscription initiated:', channelName)
    
    // 處理訂閱成功
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[usePusherNotifications] ✅ Successfully subscribed to channel:', channelName)
    })
    
    // 處理訂閱錯誤
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[usePusherNotifications] ❌ Subscription error:', {
        channelName,
        userId,
        error: error.type || error.message,
        errorStatus: error.status,
        errorData: error,
      })
    })

    // 處理通知事件
    channel.bind('notification-created', (data: any) => {
      console.log('[usePusherNotifications] ✅ Received notification:', {
        channelName,
        data,
        timestamp: new Date().toISOString(),
      })
      
      // Invalidate notifications queries to refetch new data
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    })

    // 監聽 Pusher 連接狀態變化
    const handleConnectionStateChange = (states: { previous: string; current: string }) => {
      console.log('[usePusherNotifications] Connection state changed:', {
        previous: states.previous,
        current: states.current,
        channelName,
        userId,
      })
      
      if (states.current === 'connected' && states.previous === 'disconnected' && pusherClient) {
        console.log('[usePusherNotifications] Reconnected, re-subscribing to channel:', channelName)
        const newChannel = pusherClient.subscribe(channelName)
        newChannel.bind('pusher:subscription_succeeded', () => {
          console.log('[usePusherNotifications] ✅ Re-subscribed after reconnection:', channelName)
        })
        newChannel.bind('pusher:subscription_error', (error: any) => {
          console.error('[usePusherNotifications] ❌ Re-subscription error:', {
            channelName,
            error,
          })
        })
        newChannel.bind('notification-created', (data: any) => {
          console.log('[usePusherNotifications] ✅ Received notification after reconnection:', data)
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
        })
      }
    }

    pusherClient.connection.bind('state_change', handleConnectionStateChange)
    console.log('[usePusherNotifications] Subscription setup completed:', {
      channelName,
      userId,
      connectionState: pusherClient.connection.state,
    })

    // 清理函數
    return () => {
      console.log('[usePusherNotifications] Cleaning up subscription:', channelName)
      if (pusherClient) {
        pusherClient.connection.unbind('state_change', handleConnectionStateChange)
        pusherClient.unsubscribe(channelName)
      }
    }
  }, [userId, queryClient])
}

