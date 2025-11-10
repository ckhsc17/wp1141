'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Post } from '@/types'

type InfinitePostsData = {
  pages: Array<{
    posts?: Post[]
  }>
  pageParams: unknown[]
}

type MutationContext = {
  previousLikeStatus?: { liked: boolean }
  previousQueries: Array<[unknown[], unknown]>
  previousLikedPosts: Array<[unknown[], unknown]>
}

function updatePostCollectionWithLike(
  data: unknown,
  postId: string,
  liked: boolean
): { data: unknown; targetPost?: Post } {
  let updatedData = data
  let targetPost: Post | undefined
  const adjustPost = (post: Post) => {
    if (post.id !== postId && post.originalPostId !== postId && post.originalCommentId !== postId) {
      return post
    }
    const likesCount = post._count?.likes ?? 0
    const nextLikes = likesCount + (liked ? 1 : -1)
    const nextCount = {
      likes: Math.max(0, nextLikes),
      comments: post._count?.comments ?? 0,
      repostRecords: post._count?.repostRecords ?? 0,
      ...post._count,
    }
    const adjustedPost = { ...post, _count: nextCount }
    targetPost = adjustedPost
    return adjustedPost
  }

  if (!data) {
    return { data, targetPost }
  }

  if (Array.isArray(data)) {
    updatedData = data.map((post) => adjustPost(post))
  } else if (typeof data === 'object' && data !== null) {
    if ('pages' in data && Array.isArray((data as InfinitePostsData).pages)) {
      const infiniteData = data as InfinitePostsData
      updatedData = {
        ...infiniteData,
        pages: infiniteData.pages.map((page) => ({
          ...page,
          posts: page.posts?.map((post) => adjustPost(post)),
        })),
      }
    } else if ('id' in data) {
      updatedData = adjustPost(data as Post)
    }
  }

  return { data: updatedData, targetPost }
}

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await axios.post(`/api/posts/${postId}/like`)
      return data
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      await queryClient.cancelQueries({ queryKey: ['like-status', postId] })
      await queryClient.cancelQueries({ queryKey: ['liked-posts'] })

      const previousLikeStatus = queryClient.getQueryData<{ liked: boolean }>(['like-status', postId])
      const previousQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: ['posts'] })
        .map((query) => [query.queryKey, query.state.data] as [unknown[], unknown])
      const previousLikedPosts = queryClient
        .getQueryCache()
        .findAll({ queryKey: ['liked-posts'] })
        .map((query) => [query.queryKey, query.state.data] as [unknown[], unknown])

      const isCurrentlyLiked =
        previousLikeStatus?.liked ??
        previousQueries.some(([, data]) => {
          if (!data) return false
          if (Array.isArray(data)) {
            return data.some((post) => post.id === postId && (post._count?.likes ?? 0) > 0)
          }
          if (typeof data === 'object' && data !== null) {
            if ('pages' in data && Array.isArray((data as InfinitePostsData).pages)) {
              return (data as InfinitePostsData).pages.some((page) =>
                page.posts?.some((post) => post.id === postId && (post._count?.likes ?? 0) > 0)
              )
            }
            if ('id' in data) {
              const post = data as Post
              return post.id === postId ? (post._count?.likes ?? 0) > 0 : false
            }
          }
          return false
        })

      const nextLiked = !isCurrentlyLiked
      queryClient.setQueryData(['like-status', postId], { liked: nextLiked })

      let postSnapshot: Post | undefined
      previousQueries.forEach(([queryKey, data]) => {
        const { data: updated, targetPost } = updatePostCollectionWithLike(data, postId, nextLiked)
        if (targetPost) {
          postSnapshot = targetPost
        }
        queryClient.setQueryData(queryKey, updated)
      })

      if (postSnapshot) {
        previousLikedPosts.forEach(([queryKey, data]) => {
          if (!data) return
          if (Array.isArray(data)) {
            const posts = data as Post[]
            if (nextLiked) {
              if (!posts.some((post) => post.id === postSnapshot!.id)) {
                queryClient.setQueryData(queryKey, [postSnapshot!, ...posts])
              }
            } else {
              queryClient.setQueryData(
                queryKey,
                posts.filter((post) => post.id !== postSnapshot!.id)
              )
            }
          }
        })
      }

      return { previousLikeStatus, previousQueries, previousLikedPosts } satisfies MutationContext
    },
    onError: (_err, postId, context) => {
      if (!context) return
      if (context.previousLikeStatus) {
        queryClient.setQueryData(['like-status', postId], context.previousLikeStatus)
      }
      context.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      context.previousLikedPosts.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: (_data, _error, postId) => {
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

