'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Comment, Post } from '@/types'

type InfinitePostsData = {
  pages: Array<{
    posts?: Post[]
  }>
  pageParams: unknown[]
}

type CommentsQueryData = Comment[]

type RepostMutationContext = {
  previousStatus?: { reposted: boolean }
  previousQueries: Array<[unknown[], unknown]>
}

type CommentRepostMutationContext = {
  previousStatus?: { reposted: boolean }
  previousCommentQueries: Array<[unknown[], unknown]>
  previousPostQueries: Array<[unknown[], unknown]>
}

function updatePostCollectionWithRepost(
  data: unknown,
  postId: string,
  reposted: boolean
): unknown {
  const adjustPost = (post: Post) => {
    if (post.id !== postId) {
      return post
    }
    const existingCount = post._count ?? { likes: 0, comments: 0, repostRecords: 0 }
    const currentCount = existingCount.repostRecords ?? 0
    const nextCount = currentCount + (reposted ? 1 : -1)
    return {
      ...post,
      _count: {
        ...existingCount,
        likes: existingCount.likes ?? 0,
        comments: existingCount.comments ?? 0,
        repostRecords: Math.max(0, nextCount),
      },
    }
  }

  if (!data) return data

  if (Array.isArray(data)) {
    return data.map((post) => adjustPost(post))
  }

  if (typeof data === 'object' && data !== null) {
    if ('pages' in data && Array.isArray((data as InfinitePostsData).pages)) {
      const infinite = data as InfinitePostsData
      return {
        ...infinite,
        pages: infinite.pages.map((page) => ({
          ...page,
          posts: page.posts?.map((post) => adjustPost(post)),
        })),
      }
    }
    if ('id' in data) {
      return adjustPost(data as Post)
    }
  }

  return data
}

function updateCommentCollectionWithRepost(
  data: unknown,
  commentId: string,
  reposted: boolean
): unknown {
  if (!data) return data

  const adjustComment = (comment: Comment) => {
    if (comment.id !== commentId) return comment
    const existingCount = comment._count ?? { replies: 0, likes: 0, repostRecords: 0 }
    const currentCount = existingCount.repostRecords ?? 0
    return {
      ...comment,
      _count: {
        ...existingCount,
        repostRecords: Math.max(0, currentCount + (reposted ? 1 : -1)),
      },
    }
  }

  if (Array.isArray(data)) {
    return (data as CommentsQueryData).map((comment) => adjustComment(comment))
  }

  return data
}

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
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      await queryClient.cancelQueries({ queryKey: ['repost-status', postId] })

      const previousStatus = queryClient.getQueryData<{ reposted: boolean }>(['repost-status', postId])
      const previousQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: ['posts'] })
        .map((query) => [query.queryKey, query.state.data] as [unknown[], unknown])

      const isCurrentlyReposted = previousStatus?.reposted ?? false
      const nextReposted = !isCurrentlyReposted

      queryClient.setQueryData(['repost-status', postId], { reposted: nextReposted })

      previousQueries.forEach(([queryKey, data]) => {
        const updated = updatePostCollectionWithRepost(data, postId, nextReposted)
        queryClient.setQueryData(queryKey, updated)
      })

      return { previousStatus, previousQueries } satisfies RepostMutationContext
    },
    onError: (error, postId, context) => {
      console.error('[useToggleRepost] Mutation error:', error)
      if (!context) return
      if (context.previousStatus) {
        queryClient.setQueryData(['repost-status', postId], context.previousStatus)
      }
      context.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: (_data, _error, postId) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['reposts'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['repost-status', postId] })
      queryClient.invalidateQueries({ queryKey: ['repost-status'] })
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
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['comment-repost-status', commentId] })
      await queryClient.cancelQueries({ queryKey: ['comments'] })
      await queryClient.cancelQueries({ queryKey: ['replies'] })
      await queryClient.cancelQueries({ queryKey: ['posts'] })

      const previousStatus = queryClient.getQueryData<{ reposted: boolean }>(['comment-repost-status', commentId])
      const previousCommentQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: ['comments'] })
        .concat(queryClient.getQueryCache().findAll({ queryKey: ['replies'] }))
        .map((query) => [query.queryKey, query.state.data] as [unknown[], unknown])
      const previousPostQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: ['posts'] })
        .map((query) => [query.queryKey, query.state.data] as [unknown[], unknown])

      const isCurrentlyReposted = previousStatus?.reposted ?? false
      const nextReposted = !isCurrentlyReposted

      queryClient.setQueryData(['comment-repost-status', commentId], { reposted: nextReposted })

      previousCommentQueries.forEach(([queryKey, data]) => {
        const updated = updateCommentCollectionWithRepost(data, commentId, nextReposted)
        queryClient.setQueryData(queryKey, updated)
      })

      previousPostQueries.forEach(([queryKey, data]) => {
        const updated = updatePostCollectionWithRepost(data, commentId, nextReposted)
        queryClient.setQueryData(queryKey, updated)
      })

      return {
        previousStatus,
        previousCommentQueries,
        previousPostQueries,
      } satisfies CommentRepostMutationContext
    },
    onError: (error, commentId, context) => {
      console.error('[useToggleCommentRepost] Mutation error:', error)
      if (!context) return
      if (context.previousStatus) {
        queryClient.setQueryData(['comment-repost-status', commentId], context.previousStatus)
      }
      context.previousCommentQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      context.previousPostQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: (_data, _error, commentId) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: ['reposts'] })
      queryClient.invalidateQueries({ queryKey: ['comment-repost-status', commentId] })
      queryClient.invalidateQueries({ queryKey: ['comment-repost-status'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
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

