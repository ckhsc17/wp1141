'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export interface Draft {
  id: string
  content: string
  userId: string
  createdAt: string
  updatedAt: string
}

export function useDrafts() {
  return useQuery<Draft[]>({
    queryKey: ['drafts'],
    queryFn: async () => {
      const { data } = await axios.get('/api/drafts')
      return (data.drafts as Draft[]) || []
    },
  })
}

export function useCreateDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await axios.post('/api/drafts', { content })
      return data.draft as Draft
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
    },
  })
}

export function useUpdateDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data } = await axios.put(`/api/drafts/${id}`, { content })
      return data.draft as Draft
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
    },
  })
}

export function useDeleteDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/drafts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
    },
  })
}

