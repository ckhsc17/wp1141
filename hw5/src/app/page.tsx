'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Box, Typography, CircularProgress, Alert, Paper } from '@mui/material'
import AppBar from '@/components/AppBar'
import PostForm from '@/components/PostForm'
import PostCard from '@/components/PostCard'
import AuthButtons from '@/components/AuthButtons'
import { usePosts, useToggleLike } from '@/hooks'
import { useSession } from 'next-auth/react'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { data: posts, isLoading, error } = usePosts()
  const toggleLike = useToggleLike()

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId)
  }

  // 檢查是否已登入但沒有 userId，需要設定
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !(session.user as any).userId) {
      router.push('/register/setup')
    }
  }, [status, session, router])

  // 如果未登入，顯示歡迎頁面
  if (status === 'unauthenticated') {
    return (
      <>
        <AppBar />
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              textAlign: 'center',
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
              歡迎來到 Echoo
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              使用 Google、GitHub 或 Facebook 註冊新帳號
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              或登入您現有的帳號
            </Typography>
            <AuthButtons />
          </Paper>
        </Container>
      </>
    )
  }

  return (
    <>
      <AppBar />
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Home
        </Typography>

        {session && <PostForm />}

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

        {posts && posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            isLiked={false}
          />
        ))}

        {posts && posts.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No posts yet. Be the first to post!
          </Typography>
        )}
      </Container>
    </>
  )
}
