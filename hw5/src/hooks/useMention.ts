'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import axios from 'axios'
import { Mention } from '@/types'
import { PaginatedResponse } from '@/types'
import pusherClient from '@/lib/pusher-client'

export function useMentions(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['mentions', page, limit],
    queryFn: async () => {
      const { data } = await axios.get<PaginatedResponse<Mention>>('/api/mentions', {
        params: { page, limit },
      })
      return data
    },
  })
}

export function useMarkMentionAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mentionId: string) => {
      await axios.put(`/api/mentions/${mentionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['mentions', 'unread'] })
    },
  })
}

export function useMarkAllMentionsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await axios.put('/api/mentions')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['mentions', 'unread'] })
    },
  })
}

export function useUnreadMentionCount() {
  return useQuery({
    queryKey: ['mentions', 'unread'],
    queryFn: async () => {
      const { data } = await axios.get<{ count: number }>('/api/mentions/unread')
      return data.count
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

/**
 * Hook to listen for Pusher mention notifications
 */
export function usePusherMentions(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    console.log('[usePusherMentions] Hook called:', {
      userId,
      hasClient: !!pusherClient,
      connectionState: pusherClient?.connection?.state,
    })
    
    if (!userId || !pusherClient) {
      console.log('[usePusherMentions] Missing userId or pusherClient, skipping subscription')
      return
    }

    const channelName = `private-user-${userId}`
    console.log('[usePusherMentions] Subscribing to channel:', channelName)

    // 檢查 Pusher 連接狀態
    if (pusherClient.connection.state === 'disconnected') {
      console.log('[usePusherMentions] Pusher disconnected, attempting to connect...')
      pusherClient.connect()
    }

    // 訂閱頻道
    const channel = pusherClient.subscribe(channelName)
    console.log('[usePusherMentions] Channel subscription initiated:', channelName)
    
    // 處理訂閱成功
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[usePusherMentions] ✅ Successfully subscribed to channel:', channelName)
    })
    
    // 處理訂閱錯誤
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[usePusherMentions] ❌ Subscription error:', {
        channelName,
        userId,
        error: error.type || error.message,
        errorStatus: error.status,
        errorData: error,
      })
    })

    // 處理提及通知
    channel.bind('mention-created', (data: any) => {
      console.log('[usePusherMentions] ✅ Received mention notification:', {
        channelName,
        data,
        timestamp: new Date().toISOString(),
      })
      
      // Invalidate mentions queries to refetch new data
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['mentions', 'unread'] })
    })

    // 監聽 Pusher 連接狀態變化
    const handleConnectionStateChange = (states: { previous: string; current: string }) => {
      console.log('[usePusherMentions] Connection state changed:', {
        previous: states.previous,
        current: states.current,
        channelName,
        userId,
      })
      
      if (states.current === 'connected' && states.previous === 'disconnected' && pusherClient) {
        console.log('[usePusherMentions] Reconnected, re-subscribing to channel:', channelName)
        const newChannel = pusherClient.subscribe(channelName)
        newChannel.bind('pusher:subscription_succeeded', () => {
          console.log('[usePusherMentions] ✅ Re-subscribed after reconnection:', channelName)
        })
        newChannel.bind('pusher:subscription_error', (error: any) => {
          console.error('[usePusherMentions] ❌ Re-subscription error:', {
            channelName,
            error,
          })
        })
      }
    }

    pusherClient.connection.bind('state_change', handleConnectionStateChange)
    console.log('[usePusherMentions] Subscription setup completed:', {
      channelName,
      userId,
      connectionState: pusherClient.connection.state,
    })

    // 清理函數
    return () => {
      console.log('[usePusherMentions] Cleaning up subscription:', channelName)
      if (pusherClient) {
        pusherClient.connection.unbind('state_change', handleConnectionStateChange)
        pusherClient.unsubscribe(channelName)
      }
    }
  }, [userId, queryClient])
}

