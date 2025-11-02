'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Mention } from '@/types'
import { PaginatedResponse } from '@/types'

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

