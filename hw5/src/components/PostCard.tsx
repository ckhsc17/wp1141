'use client'

import { useState } from 'react'
import { Card, CardContent, Typography, Avatar, IconButton, Box, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import RepeatIcon from '@mui/icons-material/Repeat'
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteIcon from '@mui/icons-material/Delete'
import { Post } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import MentionText from './MentionText'
import { useRepostStatus } from '@/hooks/useRepost'
import { useLikeStatus } from '@/hooks/useLike'
import { useDeletePost } from '@/hooks/usePosts'
import { useSession } from 'next-auth/react'
import UnrepostConfirmDialog from './UnrepostConfirmDialog'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onRepost?: (postId: string) => void
  onDelete?: () => void // Callback after successful deletion
  isLiked?: boolean
  isReposted?: boolean // Optional override, if not provided will check automatically
}

export default function PostCard({ post, onLike, onRepost, onDelete, isLiked: isLikedProp, isReposted: isRepostedProp }: PostCardProps) {
  // Determine which post to display - if this is a repost, show the original post or comment
  const displayPost = post.originalPost || (post.originalComment ? {
    ...post,
    content: post.originalComment.content,
    author: post.originalComment.author,
    createdAt: post.originalComment.createdAt,
  } : post)
  const isRepost = !!post.originalPost || !!post.originalComment
  const { data: session } = useSession()
  const [unrepostDialogOpen, setUnrepostDialogOpen] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const deletePost = useDeletePost()
  
  // Check if current user is the author of the displayed post
  const isOwnPost = session?.user?.id === displayPost.authorId
  
  // Check repost status if not provided as prop
  // Always check the original post's repost status (displayPost.id)
  const { data: repostStatus } = useRepostStatus(
    session?.user?.id && displayPost.id ? displayPost.id : ''
  )
  const isReposted = isRepostedProp !== undefined ? isRepostedProp : (repostStatus?.reposted || false)
  
  // Check like status if not provided as prop
  // Only use prop if explicitly provided (not undefined), otherwise check automatically
  const { data: likeStatus } = useLikeStatus(
    session?.user?.id && displayPost.id ? displayPost.id : ''
  )
  const isLikedState = isLikedProp !== undefined ? isLikedProp : (likeStatus?.liked || false)
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[PostCard] Like status:', {
      postId: displayPost.id,
      isLikedProp,
      likeStatus,
      isLikedState,
      hasSession: !!session?.user?.id,
    })
  }
  
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleDeleteClick = () => {
    handleMenuClose()
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      await deletePost.mutateAsync(displayPost.id)
      setDeleteConfirmOpen(false)
      onDelete?.() // Call callback to refresh list
    } catch (error) {
      console.error('Failed to delete post:', error)
      // You might want to show an error toast here
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
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
        {(isRepost || post.originalComment) && (
          <Box display="flex" alignItems="center" gap={1} mb={1} sx={{ pl: 7 }}>
            <RepeatIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: '0.875rem' }} />
            <Typography variant="caption" color="text.secondary">
              {post.author?.name} reposted
              {post.originalComment && (
                <span> a comment by {post.originalComment.author?.name}</span>
              )}
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
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Box display="flex" alignItems="center" gap={1}>
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
              
              {isOwnPost && (
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ color: 'text.secondary' }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              <MentionText content={displayPost.content} />
            </Typography>
            
            <Box display="flex" gap={4}>
              <IconButton 
                size="small"
                onClick={() => onLike?.(displayPost.id)}
                sx={{ color: isLikedState ? 'error.main' : 'text.secondary' }}
              >
                {isLikedState ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
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

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Post?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This can't be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from search results.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deletePost.isPending}
            color="error"
            variant="contained"
          >
            {deletePost.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

