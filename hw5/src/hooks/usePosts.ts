'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Post, PaginationParams, CreatePostInput } from '@/types'

interface GetPostsParams extends PaginationParams {
  userId?: string
  following?: boolean
}

type InfinitePostsParams = Omit<GetPostsParams, 'page'> & { enabled?: boolean }

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
    enabled: true,
  })
}

interface PostsPage {
  posts: Post[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useInfinitePosts(params?: InfinitePostsParams) {
  const { enabled = true, ...queryParams } = params ?? {}

  return useInfiniteQuery<PostsPage>({
    queryKey: ['posts', queryParams.userId, queryParams.following, queryParams.limit],
    initialPageParam: 1,
    enabled,
    queryFn: async ({ pageParam = 1 }) => {
      let url = '/api/posts'

      if (queryParams?.userId) {
        url = `/api/users/${queryParams.userId}/posts`
      } else if (queryParams?.following) {
        url = '/api/posts/following'
      }

      const { data } = await axios.get(url, {
        params: {
          page: pageParam,
          limit: queryParams?.limit || 20,
        },
      })

      return {
        posts: (data.posts as Post[]) ?? [],
        pagination: data.pagination,
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
  })
}

export function useExplorePosts(params?: { limit?: number }) {
  return useInfiniteQuery<PostsPage>({
    queryKey: ['explore-posts', params?.limit],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axios.get('/api/posts/explore', {
        params: {
          page: pageParam,
          limit: params?.limit || 20,
        },
      })

      return {
        posts: (data.posts as Post[]) ?? [],
        pagination: data.pagination,
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
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

export function useLikedPosts(userId?: string, params?: PaginationParams) {
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

