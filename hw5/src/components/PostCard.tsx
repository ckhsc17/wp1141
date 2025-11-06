'use client'

import { useState } from 'react'
import { Card, CardContent, Typography, Avatar, IconButton, Box } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import RepeatIcon from '@mui/icons-material/Repeat'
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined'
import { Post } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import MentionText from './MentionText'
import { useRepostStatus } from '@/hooks/useRepost'
import { useSession } from 'next-auth/react'
import UnrepostConfirmDialog from './UnrepostConfirmDialog'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onRepost?: (postId: string) => void
  isLiked?: boolean
  isReposted?: boolean // Optional override, if not provided will check automatically
}

export default function PostCard({ post, onLike, onRepost, isLiked = false, isReposted: isRepostedProp }: PostCardProps) {
  // Determine which post to display - if this is a repost, show the original post
  const displayPost = post.originalPost || post
  const isRepost = !!post.originalPost
  const { data: session } = useSession()
  const [unrepostDialogOpen, setUnrepostDialogOpen] = useState(false)
  
  // Check repost status if not provided as prop
  // Always check the original post's repost status (displayPost.id)
  const { data: repostStatus } = useRepostStatus(
    session?.user?.id && displayPost.id ? displayPost.id : ''
  )
  const isReposted = isRepostedProp !== undefined ? isRepostedProp : (repostStatus?.reposted || false)
  
  // Log repost status for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[PostCard] Repost status:', {
      postId: displayPost.id,
      isRepostedProp,
      repostStatus,
      isReposted,
      repostCount: displayPost._count?.repostRecords || 0,
      hasCount: !!displayPost._count,
    })
  }

  const handleRepostClick = () => {
    if (isReposted) {
      // Show confirmation dialog for unrepost
      setUnrepostDialogOpen(true)
    } else {
      // Directly repost
      onRepost?.(displayPost.id)
    }
  }

  const handleConfirmUnrepost = () => {
    onRepost?.(displayPost.id)
    setUnrepostDialogOpen(false)
  }

  return (
    <Card 
      sx={{ 
        backgroundColor: 'background.paper', 
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          backgroundColor: 'action.hover',
        }
      }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        {isRepost && (
          <Box display="flex" alignItems="center" gap={1} mb={1} sx={{ pl: 7 }}>
            <RepeatIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: '0.875rem' }} />
            <Typography variant="caption" color="text.secondary">
              {post.author?.name} reposted
            </Typography>
          </Box>
        )}
        
        <Box display="flex" gap={2}>
          <Link href={`/profile/${displayPost.author?.userId}`}>
            <Avatar 
              src={displayPost.author?.image || ''} 
              sx={{ cursor: 'pointer' }}
            >
              {displayPost.author?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Link>
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography 
                variant="subtitle2" 
                component={Link}
                href={`/profile/${displayPost.author?.userId}`}
                sx={{ 
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {displayPost.author?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                @{displayPost.author?.userId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                · {formatDistanceToNow(new Date(displayPost.createdAt), { addSuffix: true })}
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              <MentionText content={displayPost.content} />
            </Typography>
            
            <Box display="flex" gap={4}>
              <IconButton 
                size="small"
                onClick={() => onLike?.(displayPost.id)}
                sx={{ color: isLiked ? 'primary.main' : 'text.secondary' }}
              >
                {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {displayPost._count?.likes || 0}
                </Typography>
              </IconButton>
              
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('[PostCard] Repost button clicked for post:', displayPost.id)
                  console.log('[PostCard] isReposted:', isReposted)
                  handleRepostClick()
                }}
                sx={{ color: isReposted ? 'primary.main' : 'text.secondary' }}
              >
                {isReposted ? <RepeatIcon fontSize="small" /> : <RepeatOutlinedIcon fontSize="small" />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {displayPost._count?.repostRecords || 0}
                </Typography>
              </IconButton>
              
              <Link href={`/posts/${displayPost.id}`}>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <ChatBubbleOutlineIcon fontSize="small" />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {displayPost._count?.comments || 0}
                  </Typography>
                </IconButton>
              </Link>
            </Box>
          </Box>
        </Box>
      </CardContent>

      <UnrepostConfirmDialog
        open={unrepostDialogOpen}
        onClose={() => setUnrepostDialogOpen(false)}
        onConfirm={handleConfirmUnrepost}
      />
    </Card>
  )
}

