'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export interface Draft {
  id: string
  content: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export function useDraft() {
  return useQuery<Draft | null>({
    queryKey: ['draft'],
    queryFn: async () => {
      const { data } = await axios.get('/api/draft')
      return data.draft as Draft | null
    },
  })
}

export function useSaveDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await axios.post('/api/draft', { content })
      return data.draft as Draft
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] })
    },
  })
}

export function useDeleteDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await axios.delete('/api/draft')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] })
    },
  })
}

