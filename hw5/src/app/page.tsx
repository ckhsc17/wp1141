'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Box, Typography, CircularProgress, Alert, Paper, AppBar as MuiAppBar, Toolbar } from '@mui/material'
import PostForm from '@/components/PostForm'
import PostCard from '@/components/PostCard'
import AuthButtons from '@/components/AuthButtons'
import { usePosts, useToggleLike, useToggleRepost, usePusherMentions } from '@/hooks'
import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'
import { useThemeMode } from '@/contexts/ThemeContext'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { data: posts, isLoading, error } = usePosts()
  const toggleLike = useToggleLike()
  const toggleRepost = useToggleRepost()
  const { mode, toggleTheme } = useThemeMode()

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId)
  }

  const handleRepost = (postId: string) => {
    toggleRepost.mutate(postId)
  }

  // Listen for Pusher mention notifications
  usePusherMentions((session?.user as any)?.userId)

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
        <MuiAppBar 
          position="static" 
          elevation={0}
          sx={{ 
            backgroundColor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end' }}>
            <IconButton onClick={toggleTheme}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Button color="primary" variant="contained" onClick={() => signIn()}>
              Sign in
            </Button>
          </Toolbar>
        </MuiAppBar>
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
          onRepost={handleRepost}
        />
      ))}

      {posts && posts.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          No posts yet. Be the first to post!
        </Typography>
      )}
    </Container>
  )
}
