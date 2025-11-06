'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await axios.post(`/api/posts/${postId}/like`)
      return data
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['like-status', postId] })
      queryClient.invalidateQueries({ queryKey: ['like-status'] })
      queryClient.invalidateQueries({ queryKey: ['liked-posts'] })
    },
  })
}

export function useLikeStatus(postId: string) {
  return useQuery({
    queryKey: ['like-status', postId],
    queryFn: async () => {
      if (!postId) return { liked: false }
      try {
        const { data } = await axios.get(`/api/posts/${postId}/like/status`)
        return data as { liked: boolean }
      } catch (error) {
        console.error('[useLikeStatus] Error fetching like status:', error)
        return { liked: false }
      }
    },
    enabled: !!postId,
  })
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await axios.post(`/api/comments/${commentId}/like`)
      return data
    },
    onSuccess: (data, commentId) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: ['comment-like-status', commentId] })
      queryClient.invalidateQueries({ queryKey: ['comment-like-status'] })
    },
  })
}

export function useCommentLikeStatus(commentId: string) {
  return useQuery({
    queryKey: ['comment-like-status', commentId],
    queryFn: async () => {
      if (!commentId) return { liked: false }
      try {
        const { data } = await axios.get(`/api/comments/${commentId}/like/status`)
        return data as { liked: boolean }
      } catch (error) {
        console.error('[useCommentLikeStatus] Error fetching comment like status:', error)
        return { liked: false }
      }
    },
    enabled: !!commentId,
  })
}

