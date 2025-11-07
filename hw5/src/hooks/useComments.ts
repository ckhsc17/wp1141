'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Comment, CreateCommentInput } from '@/types'

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/posts/${postId}/comments`)
      return data.comments as Comment[]
    },
    enabled: !!postId,
  })
}

export function useReplies(commentId: string) {
  return useQuery({
    queryKey: ['replies', commentId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/comments/${commentId}/replies`)
      return data.replies as Comment[]
    },
    enabled: !!commentId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const { data } = await axios.post(`/api/posts/${input.postId}/comments`, input)
      return data.comment as Comment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useCreateReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, content, postId }: { commentId: string; content: string; postId: string }) => {
      const { data } = await axios.post(`/api/comments/${commentId}/replies`, { content })
      return data.reply as Comment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['replies', variables.commentId] })
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/comments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies'] })
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

