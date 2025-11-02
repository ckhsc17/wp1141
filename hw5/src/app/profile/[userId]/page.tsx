'use client'

import { useState } from 'react'
import { Container, Box, Typography, Avatar, CircularProgress, Alert, Button, IconButton } from '@mui/material'
import { useParams, useRouter } from 'next/navigation'
import { useUser, usePosts, useToggleLike } from '@/hooks'
import PostCard from '@/components/PostCard'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import EditProfileModal from '@/components/EditProfileModal'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const { data: session } = useSession()
  const { data: user, isLoading: isUserLoading, error: userError } = useUser(userId)
  const { data: posts, isLoading: isPostsLoading, error: postsError } = usePosts({ userId })
  const toggleLike = useToggleLike()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const isOwnProfile = session?.user && (session.user as any).userId === userId

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId)
  }

  if (isUserLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (userError || !user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          Failed to load user profile
        </Alert>
      </Container>
    )
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Header with Name and Posts Count */}
      <Box sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        py: 2,
        px: 2,
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => router.push('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user._count?.posts || 0} posts
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Banner Image */}
      <Box 
        sx={{ 
          height: 200,
          backgroundColor: 'action.hover',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', bottom: -75, left: '50%', transform: 'translateX(-50%)' }}>
          <Avatar 
            src={user.image || ''} 
            sx={{ width: 150, height: 150, border: '4px solid', borderColor: 'background.default' }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
        {isOwnProfile && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setEditModalOpen(true)}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              borderColor: 'text.primary',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'text.primary',
                backgroundColor: 'action.hover',
              }
            }}
          >
            Edit profile
          </Button>
        )}
      </Box>

      {/* Profile Info */}
      <Container maxWidth="sm" sx={{ mt: 12, mb: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            @{user.userId}
          </Typography>
          {user.bio && (
            <Typography variant="body2" color="text.primary" textAlign="center" mb={2}>
              {user.bio}
            </Typography>
          )}
          {user.createdAt && (
            <Typography variant="caption" color="text.secondary">
              Joined {format(new Date(user.createdAt), 'MMMM yyyy')}
            </Typography>
          )}
        </Box>

        {/* Following/Followers (Placeholder for future) */}
        {/* <Box display="flex" gap={4} justifyContent="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            99 Following
          </Typography>
          <Typography variant="body2" color="text.secondary">
            40 Followers
          </Typography>
        </Box> */}
      </Container>

      {/* Posts Section */}
      <Container maxWidth="sm">
        {isPostsLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {postsError && (
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
            No posts yet
          </Typography>
        )}
      </Container>

      {isOwnProfile && (
        <EditProfileModal 
          open={editModalOpen} 
          onClose={() => setEditModalOpen(false)} 
          user={user}
        />
      )}
    </Box>
  )
}
