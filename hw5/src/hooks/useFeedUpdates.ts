'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import pusherClient from '@/lib/pusher-client'
import { Post } from '@/types'

type InfinitePostsData = {
  pages: Array<{
    posts?: Post[]
  }>
  pageParams: unknown[]
}

export function useFeedUpdates(currentUserId?: string) {
  const queryClient = useQueryClient()
  const [newPostCount, setNewPostCount] = useState(0)

  useEffect(() => {
    if (!pusherClient) {
      console.log('[useFeedUpdates] Pusher client not available')
      return
    }

    console.log('[useFeedUpdates] Subscribing to public-feed channel')
    const channel = pusherClient.subscribe('public-feed')

    // Handle new post events
    channel.bind('new-post', (data: any) => {
      console.log('[useFeedUpdates] New post event received:', data)
      // Only show banner if the post is not from current user
      if (data.authorId !== currentUserId) {
        setNewPostCount((prev) => prev + 1)
      }
    })

    // Handle post stats updates (silent, no UI change except counts)
    channel.bind('post-stats-updated', (data: { postId: string; likes: number; comments: number; reposts: number }) => {
      console.log('[useFeedUpdates] Post stats updated:', data)
      
      // Update all post caches with new stats
      const postQueries = queryClient.getQueryCache().findAll({ queryKey: ['posts'] })
      
      postQueries.forEach((query) => {
        const queryData = query.state.data
        if (!queryData) return

        if (Array.isArray(queryData)) {
          const updated = queryData.map((post: Post) => {
            if (post.id === data.postId) {
              return {
                ...post,
                _count: {
                  ...(post._count ?? {}),
                  likes: data.likes,
                  comments: data.comments,
                  repostRecords: data.reposts,
                },
              }
            }
            return post
          })
          queryClient.setQueryData(query.queryKey, updated)
        } else if (typeof queryData === 'object' && 'pages' in queryData) {
          const infiniteData = queryData as InfinitePostsData
          const updated = {
            ...infiniteData,
            pages: infiniteData.pages.map((page) => ({
              ...page,
              posts: page.posts?.map((post) => {
                if (post.id === data.postId) {
                  return {
                    ...post,
                    _count: {
                      ...(post._count ?? {}),
                      likes: data.likes,
                      comments: data.comments,
                      repostRecords: data.reposts,
                    },
                  }
                }
                return post
              }),
            })),
          }
          queryClient.setQueryData(query.queryKey, updated)
        }
      })
    })

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[useFeedUpdates] Successfully subscribed to public-feed')
    })

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[useFeedUpdates] Subscription error:', error)
    })

    return () => {
      console.log('[useFeedUpdates] Unsubscribing from public-feed')
      if (pusherClient) {
        channel.unbind_all()
        pusherClient.unsubscribe('public-feed')
      }
    }
  }, [queryClient, currentUserId])

  const resetNewPostCount = () => {
    setNewPostCount(0)
  }

  return {
    newPostCount,
    resetNewPostCount,
  }
}

