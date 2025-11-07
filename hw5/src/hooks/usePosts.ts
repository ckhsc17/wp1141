'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Post, PaginationParams, CreatePostInput } from '@/types'

interface GetPostsParams extends PaginationParams {
  userId?: string
  following?: boolean
}

export function usePosts(params?: GetPostsParams) {
  return useQuery({
    queryKey: ['posts', params?.userId, params?.following, params?.page, params?.limit],
    queryFn: async () => {
      let url = '/api/posts'
      
      if (params?.userId) {
        url = `/api/users/${params.userId}/posts`
      } else if (params?.following) {
        url = '/api/posts/following'
      }
      
      const { data } = await axios.get(url, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
        },
      })
      return data.posts as Post[]
    },
    enabled: true, // Always enabled
  })
}

export function useReposts(userId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: ['reposts', userId, params?.page, params?.limit],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/${userId}/reposts`, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
        },
      })
      return data.posts as Post[]
    },
    enabled: !!userId,
  })
}

export function useLikedPosts(userId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: ['liked-posts', userId, params?.page, params?.limit],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/${userId}/likes`, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
        },
      })
      return data.posts as Post[]
    },
    enabled: !!userId,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const { data } = await axios.post('/api/posts', input)
      return data.post as Post
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CreatePostInput }) => {
      const { data } = await axios.put(`/api/posts/${id}`, input)
      return data.post as Post
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/posts/${id}`)
    },
    onSuccess: () => {
      // Invalidate all post-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
      queryClient.invalidateQueries({ queryKey: ['reposts'] })
      queryClient.invalidateQueries({ queryKey: ['liked-posts'] })
    },
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/posts/${id}`)
      return data.post as Post
    },
    enabled: !!id,
  })
}

