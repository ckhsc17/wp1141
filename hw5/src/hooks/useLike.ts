'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await axios.post(`/api/posts/${postId}/like`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

