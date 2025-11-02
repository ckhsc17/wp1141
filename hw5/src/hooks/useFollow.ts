'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export function useFollowStatus(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['followStatus', userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/${userId}/follow`)
      return data.isFollowing as boolean
    },
    enabled: !!userId && enabled,
  })
}

export function useToggleFollow(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(`/api/users/${userId}/follow`)
      return data.isFollowing as boolean
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] })
      queryClient.invalidateQueries({ queryKey: ['users', userId] }) // Invalidate user profile to update following/followers count
    },
  })
}

