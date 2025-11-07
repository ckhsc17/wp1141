'use client'

import { useEffect, useState } from 'react'
import { Container, Box, Typography, Avatar, CircularProgress, Alert, Button, IconButton } from '@mui/material'
import { useParams, useRouter } from 'next/navigation'
import { useUser, usePosts, useReposts, useLikedPosts, useToggleLike, useToggleRepost } from '@/hooks'
import PostCard from '@/components/PostCard'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import EditProfileModal from '@/components/EditProfileModal'
import FollowButton from '@/components/FollowButton'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const { data: session } = useSession()
  const isOwnProfile = session?.user && (session.user as any).userId === userId
  const { data: user, isLoading: isUserLoading, error: userError } = useUser(userId)
  const { data: posts, isLoading: isPostsLoading, error: postsError } = usePosts({ userId })
  const { data: reposts, isLoading: isRepostsLoading, error: repostsError } = useReposts(userId)
  const { data: likedPosts, isLoading: isLikedPostsLoading, error: likedPostsError } = useLikedPosts(
    isOwnProfile ? userId : undefined
  )
  const toggleLike = useToggleLike()
  const toggleRepost = useToggleRepost()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'likes'>('posts')

  useEffect(() => {
    if (!isOwnProfile && activeTab === 'likes') {
      setActiveTab('posts')
    }
  }, [isOwnProfile, activeTab])

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId)
  }

  const handleRepost = (postId: string) => {
    toggleRepost.mutate(postId)
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
    <Box
    sx={{
        //display: 'flex',
        //justifyContent: 'center',
        //alignItems: 'center',
        //width: '100%',        // 若你要水平填滿
        //minHeight: '100vh',   // 若你也要垂直置中整屏
        maxWidth: 'sm',       // 若你預期內容最大寬度為 theme 的 sm 尺寸
        margin: '0 auto',     // 保證在大螢幕時水平置中
    }}
    >
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
        {isOwnProfile ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setEditModalOpen(true)}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              borderRadius: '9999px',
              textTransform: 'none',
              px: 2,
              py: 0.5,
              borderColor: 'text.primary',
              color: 'text.primary',
              backgroundColor: 'background.paper',
              '&:hover': {
                borderColor: 'text.primary',
                backgroundColor: 'action.hover',
              }
            }}
          >
            Edit profile
          </Button>
        ) : session && (
          <FollowButton userId={userId} username={user.userId} />
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

        <Box display="flex" gap={4} justifyContent="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            <Typography component="span" fontWeight={700} color="text.primary">
              {user._count?.following || 0}
            </Typography>{' '}
            Following
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Typography component="span" fontWeight={700} color="text.primary">
              {user._count?.followers || 0}
            </Typography>{' '}
            Followers
          </Typography>
        </Box>
      </Container>

      {/* Posts/Reposts Section */}
      <Container maxWidth="sm" sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex' }}>
          <Typography 
            variant="body2" 
            fontWeight={600}
            onClick={() => setActiveTab('posts')}
            sx={{ 
              py: 2,
              px: 3,
              borderBottom: activeTab === 'posts' ? '2px solid' : 'none',
              borderColor: 'primary.main',
              cursor: 'pointer',
              color: activeTab === 'posts' ? 'text.primary' : 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            Posts
          </Typography>
          <Typography 
            variant="body2" 
            fontWeight={600}
            onClick={() => setActiveTab('reposts')}
            sx={{ 
              py: 2,
              px: 3,
              borderBottom: activeTab === 'reposts' ? '2px solid' : 'none',
              borderColor: 'primary.main',
              cursor: 'pointer',
              color: activeTab === 'reposts' ? 'text.primary' : 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            Reposts
          </Typography>
          {isOwnProfile && (
            <Typography 
              variant="body2" 
              fontWeight={600}
              onClick={() => setActiveTab('likes')}
              sx={{ 
                py: 2,
                px: 3,
                borderBottom: activeTab === 'likes' ? '2px solid' : 'none',
                borderColor: 'primary.main',
                cursor: 'pointer',
                color: activeTab === 'likes' ? 'text.primary' : 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              Likes
            </Typography>
          )}
        </Box>
        
        {activeTab === 'posts' && (
          <>
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

            {posts && posts.filter(post => !post.originalPostId).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onRepost={handleRepost}
              />
            ))}

            {posts && posts.filter(post => !post.originalPostId).length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                No posts yet
              </Typography>
            )}
          </>
        )}

        {activeTab === 'reposts' && (
          <>
            {isRepostsLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}

            {repostsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load reposts
              </Alert>
            )}

            {reposts && reposts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onRepost={handleRepost}
                isLiked={false}
                isReposted={true} // In reposts tab, all posts are reposted by the user
              />
            ))}

            {reposts && reposts.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                No reposts yet
              </Typography>
            )}
          </>
        )}

        {activeTab === 'likes' && isOwnProfile && (
          <>
            {isLikedPostsLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}

            {likedPostsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load liked posts
              </Alert>
            )}

            {likedPosts && likedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onRepost={handleRepost}
              />
            ))}

            {likedPosts && likedPosts.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                No liked posts yet
              </Typography>
            )}
          </>
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
