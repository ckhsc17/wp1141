'use client'

import { useState } from 'react'
import { Card, CardContent, Typography, Avatar, IconButton, Box, Link, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import DeleteIcon from '@mui/icons-material/Delete'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import RepeatIcon from '@mui/icons-material/Repeat'
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Comment } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDeleteComment, useToggleCommentLike, useCommentLikeStatus, useToggleCommentRepost, useCommentRepostStatus } from '@/hooks'
import MentionText from './MentionText'
import UnrepostConfirmDialog from './UnrepostConfirmDialog'

interface CommentCardProps {
  comment: Comment
  onDelete?: () => void
  postId: string
  clickable?: boolean
}

export default function CommentCard({ comment, onDelete, postId, clickable = true }: CommentCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const deleteComment = useDeleteComment()
  const toggleCommentLike = useToggleCommentLike()
  const toggleCommentRepost = useToggleCommentRepost()
  const { data: likeStatus } = useCommentLikeStatus(comment.id)
  const { data: repostStatus } = useCommentRepostStatus(comment.id)
  
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [unrepostDialogOpen, setUnrepostDialogOpen] = useState(false)
  
  const isOwner = session?.user?.id === comment.authorId
  const isLiked = likeStatus?.liked || false
  const isReposted = repostStatus?.reposted || false
  
  const targetHref = `/posts/${postId}?commentId=${comment.id}`

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!clickable) return
    if (deleteConfirmOpen || Boolean(menuAnchorEl)) {
      return
    }

    const target = event.target as HTMLElement
    if (target.closest('button, a, [data-no-navigation]')) {
      return
    }

    router.push(targetHref)
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
      await deleteComment.mutateAsync(comment.id)
      setDeleteConfirmOpen(false)
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleCommentLike.mutate(comment.id)
  }

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isReposted) {
      setUnrepostDialogOpen(true)
    } else {
      toggleCommentRepost.mutate(comment.id)
    }
  }

  const handleConfirmUnrepost = () => {
    toggleCommentRepost.mutate(comment.id)
    setUnrepostDialogOpen(false)
  }

  const handleCancelUnrepost = () => {
    setUnrepostDialogOpen(false)
  }

  return (
    <Card 
      onClick={handleClick}
      sx={{ 
        backgroundColor: 'background.paper', 
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: clickable ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: clickable ? 'action.hover' : 'background.paper',
        }
      }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box display="flex" gap={2}>
          <Link href={`/profile/${comment.author?.userId}`} onClick={(e) => e.stopPropagation()}>
            <Avatar 
              src={comment.author?.image || ''} 
              sx={{ cursor: 'pointer' }}
            >
              {comment.author?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Link>
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography 
                  variant="subtitle2" 
                  component={Link}
                  href={`/profile/${comment.author?.userId}`}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ 
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'text.primary',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {comment.author?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{comment.author?.userId}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  · {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
              
              {isOwner && (
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  data-no-navigation
                  sx={{ color: 'text.secondary' }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              <MentionText content={comment.content} />
            </Typography>
            
            <Box display="flex" alignItems="center" gap={4}>
              <IconButton 
                size="small"
                onClick={handleLike}
                data-no-navigation
                sx={{ color: isLiked ? 'error.main' : 'text.secondary' }}
              >
                {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {comment._count?.likes || 0}
                </Typography>
              </IconButton>
              
              <IconButton 
                size="small"
                onClick={handleRepost}
                data-no-navigation
                sx={{ color: isReposted ? 'primary.main' : 'text.secondary' }}
              >
                {isReposted ? <RepeatIcon fontSize="small" /> : <RepeatOutlinedIcon fontSize="small" />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {comment._count?.repostRecords || 0}
                </Typography>
              </IconButton>
              
              <IconButton 
                size="small" 
                sx={{ color: 'text.secondary' }}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(targetHref)
                }}
                data-no-navigation
              >
                <ChatBubbleOutlineIcon fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {comment._count?.replies || 0}
                </Typography>
              </IconButton>
            </Box>
          </Box>
        </Box>
      </CardContent>

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
        <DialogTitle>Delete Comment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This can't be undone and it will be removed from the post.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleteComment.isPending}
            color="error"
            variant="contained"
          >
            {deleteComment.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <UnrepostConfirmDialog
        open={unrepostDialogOpen}
        onClose={handleCancelUnrepost}
        onConfirm={handleConfirmUnrepost}
      />
    </Card>
  )
}

