'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { User } from '@/types'

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/${userId}`)
      return data.user as User
    },
    enabled: !!userId,
  })
}

