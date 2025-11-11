'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  InputAdornment,
} from '@mui/material'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import PostCard from '@/components/PostCard'
import AuthButtons from '@/components/AuthButtons'
import {
  useExplorePosts,
  useToggleLike,
  useToggleRepost,
  useToggleCommentRepost,
  usePusherNotifications,
} from '@/hooks'
import SearchIcon from '@mui/icons-material/Search'

export default function ExplorePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [searchTerm, setSearchTerm] = useState('')

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useExplorePosts({ enabled: status === 'authenticated' })

  const toggleLike = useToggleLike()
  const toggleRepost = useToggleRepost()
  const toggleCommentRepost = useToggleCommentRepost()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts ?? []) ?? [],
    [data]
  )

  const visiblePosts = useMemo(
    () => posts.filter((post) => !post.originalCommentId),
    [posts]
  )

  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) {
      return visiblePosts
    }

    const term = searchTerm.trim().toLowerCase()
    return visiblePosts.filter((post) => {
      const content = post.content?.toLowerCase() || ''
      const authorName = post.author?.name?.toLowerCase() || ''
      return content.includes(term) || authorName.includes(term)
    })
  }, [visiblePosts, searchTerm])

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

  const handlePostDelete = () => {
    refetch()
  }

  usePusherNotifications((session?.user as any)?.userId)

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !(session.user as any).userId) {
      router.push('/register/setup')
    }
  }, [status, session, router])

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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

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
        Explore
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search posts or creators"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoading && !data && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load posts
        </Alert>
      )}

      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onRepost={handleRepost}
          onDelete={handlePostDelete}
        />
      ))}

      {visiblePosts.length === 0 && !isLoading && !searchTerm && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          No recommendations yet. Interact with more posts to improve your feed!
        </Typography>
      )}

      {visiblePosts.length > 0 && filteredPosts.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          No posts matched "{searchTerm}". Try a different keyword.
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

