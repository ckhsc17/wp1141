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
    if (!userId || !pusherClient) {
      console.log('[usePusherMentions] Pusher client or userId not available', { userId, hasClient: !!pusherClient })
      return
    }

    const channelName = `private-user-${userId}`
    console.log('[usePusherMentions] Subscribing to channel:', channelName)

    // 檢查 Pusher 連接狀態
    if (pusherClient.connection.state === 'disconnected') {
      console.log('[usePusherMentions] Pusher is disconnected, attempting to connect...')
      pusherClient.connect()
    }

    // 訂閱頻道
    const channel = pusherClient.subscribe(channelName)
    
    // 處理訂閱成功
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[usePusherMentions] Successfully subscribed to channel:', channelName)
    })

    // 處理訂閱錯誤
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[usePusherMentions] Subscription error:', error)
      console.error('[usePusherMentions] Error details:', {
        channelName,
        userId,
        errorType: error.type,
        errorStatus: error.status,
      })
    })

    // 處理提及通知
    channel.bind('mention-created', (data: any) => {
      console.log('[usePusherMentions] Received mention notification:', data)
      
      // Invalidate mentions queries to refetch new data
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['mentions', 'unread'] })
    })

    // 監聽 Pusher 連接狀態變化
    const handleConnectionStateChange = (states: { previous: string; current: string }) => {
      console.log('[usePusherMentions] Pusher connection state changed:', {
        previous: states.previous,
        current: states.current,
        channelName,
        userId,
      })
      
      if (states.current === 'connected' && states.previous === 'disconnected' && pusherClient) {
        console.log('[usePusherMentions] Reconnected to Pusher, re-subscribing to channel:', channelName)
        const newChannel = pusherClient.subscribe(channelName)
        newChannel.bind('pusher:subscription_succeeded', () => {
          console.log('[usePusherMentions] Successfully re-subscribed after reconnection:', channelName)
        })
        newChannel.bind('pusher:subscription_error', (error: any) => {
          console.error('[usePusherMentions] Re-subscription error after reconnection:', {
            channelName,
            error,
          })
        })
      }
    }

    pusherClient.connection.bind('state_change', handleConnectionStateChange)
    
    console.log('[usePusherMentions] Pusher subscription setup completed:', {
      channelName,
      userId,
      connectionState: pusherClient.connection.state,
    })

    // 清理函數
    return () => {
      console.log('[usePusherMentions] Unsubscribing from channel:', channelName)
      if (pusherClient) {
        pusherClient.connection.unbind('state_change', handleConnectionStateChange)
        pusherClient.unsubscribe(channelName)
      }
    }
  }, [userId, queryClient])
}

