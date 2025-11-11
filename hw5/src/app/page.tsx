'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Box, Typography, CircularProgress, Alert, Paper } from '@mui/material'
import Image from 'next/image'
import PostForm from '@/components/PostForm'
import PostCard from '@/components/PostCard'
import AuthButtons from '@/components/AuthButtons'
import { useInfinitePosts, useToggleLike, useToggleRepost, useToggleCommentRepost, usePusherNotifications } from '@/hooks'
import { useFeedUpdates } from '@/hooks/useFeedUpdates'
import NewPostsBanner from '@/components/NewPostsBanner'
import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou')
  const postsEnabled = status === 'authenticated'
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfinitePosts({
    following: activeTab === 'following',
    enabled: postsEnabled,
  })
  const toggleLike = useToggleLike()
  const toggleRepost = useToggleRepost()
  const toggleCommentRepost = useToggleCommentRepost()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const { newPostCount, resetNewPostCount } = useFeedUpdates()

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts ?? []) ?? [],
    [data]
  )

  const visiblePosts = useMemo(
    () => posts.filter((post) => !post.originalCommentId),
    [posts]
  )

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId)
  }

  const handleRepost = (targetId: string, options?: { isComment?: boolean }) => {
    if (options?.isComment) {
      toggleCommentRepost.mutate(targetId)
    } else {
      toggleRepost.mutate(targetId)
    }
  }

  // Listen for Pusher notifications (includes mentions, likes, comments)
  usePusherNotifications((session?.user as any)?.userId)

  const handlePostDelete = () => {
    refetch() // Refetch posts after deletion
  }

  const handleLoadNewPosts = () => {
    resetNewPostCount()
    refetch()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const loadMoreEl = loadMoreRef.current
    if (!loadMoreEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(loadMoreEl)

    return () => {
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, activeTab])

  // 檢查是否已登入但沒有 userId，需要設定
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !(session.user as any).userId) {
      router.push('/register/setup')
    }
  }, [status, session, router])

  // 如果未登入，顯示歡迎頁面
  if (status === 'unauthenticated') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              textAlign: 'center',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              borderRadius: 3,
            }}
          >
            <Box display="flex" justifyContent="center" mb={3}>
              <Image src="/favicon.ico" alt="Echoo logo" width={192} height={192} />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
              歡迎來到 Echoo
            </Typography>
            <Typography variant="body1" sx={{ mb: 1, color: '#FFFFFF' }}>
              使用 Google、GitHub 或 Facebook 註冊新帳號
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: '#FFFFFF' }}>
              或登入您現有的帳號
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: '#FFFFFF' }}>
              ！！！Vercel 上 Postgres 因 serverless 模式載入較慢（經測試需 3-5 分鐘），請耐心等候感謝！！！
            </Typography>
            <Box sx={{ maxWidth: 400, mx: 'auto' }}>
              <AuthButtons />
            </Box>
          </Paper>
        </Container>
      </Box>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Home
      </Typography>

      {/* Tab Navigation */}
      <Box display="flex" justifyContent="space-around" borderBottom="1px solid" borderColor="divider" mb={2}>
        <Typography
          variant="body2"
          fontWeight={600}
          onClick={() => setActiveTab('foryou')}
          sx={{
            py: 2,
            px: 3,
            borderBottom: activeTab === 'foryou' ? '2px solid' : 'none',
            borderColor: 'primary.main',
            cursor: 'pointer',
            color: activeTab === 'foryou' ? 'text.primary' : 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          For You
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          onClick={() => setActiveTab('following')}
          sx={{
            py: 2,
            px: 3,
            borderBottom: activeTab === 'following' ? '2px solid' : 'none',
            borderColor: 'primary.main',
            cursor: 'pointer',
            color: activeTab === 'following' ? 'text.primary' : 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          Following
        </Typography>
      </Box>

      {session && <PostForm />}

      <NewPostsBanner count={newPostCount} onLoadNew={handleLoadNewPosts} />

      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load posts
        </Alert>
      )}

      {visiblePosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onRepost={handleRepost}
          onDelete={handlePostDelete}
        />
      ))}

      {visiblePosts.length === 0 && !isLoading && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          {activeTab === 'following' 
            ? 'No posts from people you follow yet. Start following people to see their posts here!'
            : 'No posts yet. Be the first to post!'
          }
        </Typography>
      )}

      <Box
        ref={loadMoreRef}
        sx={{
          py: 3,
          display: hasNextPage || isFetchingNextPage ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isFetchingNextPage && <CircularProgress size={32} thickness={5} />}
      </Box>
    </Container>
  )
}
