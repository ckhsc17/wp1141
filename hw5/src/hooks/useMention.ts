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
      console.log('[usePusherMentions] Pusher client or userId not available')
      return
    }

    console.log('[usePusherMentions] Subscribing to channel:', `private-user-${userId}`)

    const channel = pusherClient.subscribe(`private-user-${userId}`)
    
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[usePusherMentions] Successfully subscribed to channel')
    })

    channel.bind('mention-created', (data: any) => {
      console.log('[usePusherMentions] Received mention notification:', data)
      
      // Invalidate mentions queries to refetch new data
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['mentions', 'unread'] })
    })

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[usePusherMentions] Subscription error:', error)
    })

    return () => {
      console.log('[usePusherMentions] Unsubscribing from channel')
      if (pusherClient) {
        pusherClient.unsubscribe(`private-user-${userId}`)
      }
    }
  }, [userId, queryClient])
}

