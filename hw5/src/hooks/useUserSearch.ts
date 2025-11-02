'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { User } from '@/types'

interface SearchUsersResponse {
  users: User[]
}

export function useUserSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return []
      }

      const { data } = await axios.get<SearchUsersResponse>('/api/users/search', {
        params: { q: query },
      })
      return data.users
    },
    enabled: enabled && query.trim().length > 0,
  })
}

