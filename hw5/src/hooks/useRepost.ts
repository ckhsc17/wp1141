'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export function useToggleRepost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      console.log('[useToggleRepost] Toggling repost for post:', postId)
      try {
        const { data } = await axios.post(`/api/posts/${postId}/repost`)
        console.log('[useToggleRepost] Repost toggled successfully:', data)
        return data
      } catch (error) {
        console.error('[useToggleRepost] Error toggling repost:', error)
        throw error
      }
    },
    onSuccess: (data, postId) => {
      console.log('[useToggleRepost] Invalidating queries for postId:', postId)
      // Invalidate all post-related queries
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['reposts'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['repost-status', postId] })
      // Also invalidate all repost-status queries to refresh all post cards
      queryClient.invalidateQueries({ queryKey: ['repost-status'] })
    },
    onError: (error) => {
      console.error('[useToggleRepost] Mutation error:', error)
    },
  })
}

export function useRepostStatus(postId: string) {
  return useQuery({
    queryKey: ['repost-status', postId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/posts/${postId}/repost/status`)
      return data as { reposted: boolean }
    },
    enabled: !!postId,
  })
}

export function useToggleCommentRepost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      console.log('[useToggleCommentRepost] Toggling repost for comment:', commentId)
      try {
        const { data } = await axios.post(`/api/comments/${commentId}/repost`)
        console.log('[useToggleCommentRepost] Repost toggled successfully:', data)
        return data
      } catch (error) {
        console.error('[useToggleCommentRepost] Error toggling repost:', error)
        throw error
      }
    },
    onSuccess: (data, commentId) => {
      console.log('[useToggleCommentRepost] Invalidating queries for commentId:', commentId)
      // Invalidate all comment-related queries
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: ['reposts'] })
      queryClient.invalidateQueries({ queryKey: ['comment-repost-status', commentId] })
      // Also invalidate all repost-status queries to refresh all comment cards
      queryClient.invalidateQueries({ queryKey: ['comment-repost-status'] })
    },
    onError: (error) => {
      console.error('[useToggleCommentRepost] Mutation error:', error)
    },
  })
}

export function useCommentRepostStatus(commentId: string) {
  return useQuery({
    queryKey: ['comment-repost-status', commentId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/comments/${commentId}/repost/status`)
      return data as { reposted: boolean }
    },
    enabled: !!commentId,
  })
}

