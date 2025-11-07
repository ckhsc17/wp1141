'use client'

import { useMemo, useState } from 'react'
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
import { useRepostStatus, useCommentRepostStatus } from '@/hooks/useRepost'
import { useLikeStatus } from '@/hooks/useLike'
import { useDeletePost } from '@/hooks/usePosts'
import { useSession } from 'next-auth/react'
import UnrepostConfirmDialog from './UnrepostConfirmDialog'
import { useRouter } from 'next/navigation'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onRepost?: (targetId: string, options?: { isComment?: boolean }) => void
  onDelete?: () => void // Callback after successful deletion
  isLiked?: boolean
  isReposted?: boolean // Optional override, if not provided will check automatically
}

export default function PostCard({ post, onLike, onRepost, onDelete, isLiked: isLikedProp, isReposted: isRepostedProp }: PostCardProps) {
  const originalPost = post.originalPost ?? undefined
  const originalComment = post.originalComment ?? undefined

  // Determine which post to display - if this is a repost, show the original post or comment
  const displayPost = originalPost || (originalComment ? {
    ...post,
    content: originalComment.content,
    author: originalComment.author,
    createdAt: originalComment.createdAt,
  } : post)

  const originalPostId = originalPost?.id ?? post.originalPostId ?? null
  const originalCommentId = originalComment?.id ?? post.originalCommentId ?? null
  const commentPostId = originalComment?.postId
  const isCommentTarget = Boolean(originalCommentId)
  const repostTargetId = isCommentTarget ? (originalCommentId ?? '') : (originalPostId ?? post.id)

  const targetHref = useMemo(() => {
    if (originalComment && commentPostId) {
      return `/posts/${commentPostId}?commentId=${originalComment.id}`
    }
    if (post.originalCommentId && commentPostId) {
      return `/posts/${commentPostId}?commentId=${post.originalCommentId}`
    }
    if (originalPost) {
      return `/posts/${originalPost.id}`
    }
    if (post.originalPostId) {
      return `/posts/${post.originalPostId}`
    }
    return `/posts/${post.id}`
  }, [commentPostId, originalComment, originalPost, post])

  const { data: session } = useSession()
  const router = useRouter()
  const [unrepostDialogOpen, setUnrepostDialogOpen] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const deletePost = useDeletePost()
  
  // Check if current user is the author of the displayed post
  const isOwnPost = session?.user?.id === displayPost.authorId
  
  const { data: postRepostStatus } = useRepostStatus(!isCommentTarget ? repostTargetId : '')
  const { data: commentRepostStatus } = useCommentRepostStatus(isCommentTarget ? repostTargetId : '')
  const resolvedReposted = isCommentTarget ? (commentRepostStatus?.reposted || false) : (postRepostStatus?.reposted || false)
  const isReposted = isRepostedProp !== undefined ? isRepostedProp : resolvedReposted
  
  // Check like status only for post targets
  const { data: likeStatus } = useLikeStatus(
    !isCommentTarget && session?.user?.id ? repostTargetId : ''
  )
  const isLikedState = isLikedProp !== undefined ? isLikedProp : (likeStatus?.liked || false)

  const likesCount = isCommentTarget
    ? originalComment?._count?.likes ?? 0
    : displayPost._count?.likes ?? 0

  const repostCount = isCommentTarget
    ? originalComment?._count?.repostRecords ?? 0
    : displayPost._count?.repostRecords ?? 0

  const commentsCount = isCommentTarget
    ? originalComment?._count?.replies ?? 0
    : displayPost._count?.comments ?? 0
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[PostCard] Like status:', {
      postId: repostTargetId,
      isLikedProp,
      likeStatus,
      isLikedState,
      hasSession: !!session?.user?.id,
    })
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[PostCard] Repost status:', {
      postId: repostTargetId,
      isRepostedProp,
      postRepostStatus,
      commentRepostStatus,
      isReposted,
      repostCount,
      hasCount: !!displayPost._count,
      isCommentTarget,
    })
  }

  const handleRepostClick = () => {
    if (!onRepost) return
    if (isReposted) {
      setUnrepostDialogOpen(true)
    } else {
      onRepost(repostTargetId, { isComment: isCommentTarget })
    }
  }

  const handleConfirmUnrepost = () => {
    if (!onRepost) {
      setUnrepostDialogOpen(false)
      return
    }
    onRepost(repostTargetId, { isComment: isCommentTarget })
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

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (unrepostDialogOpen || deleteConfirmOpen || Boolean(menuAnchorEl)) {
      return
    }

    const target = event.target as HTMLElement
    if (target.closest('button, a, [data-no-navigation]')) {
      return
    }
    router.push(targetHref)
  }

  return (
    <Card 
      onClick={handleCardClick}
      sx={{ 
        backgroundColor: 'background.paper', 
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
        }
      }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        {(post.originalPost || post.originalComment) && (
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
                  data-no-navigation
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
                onClick={(e) => {
                  e.stopPropagation()
                  onLike?.(displayPost.id)
                }}
                data-no-navigation
                sx={{ color: isLikedState ? 'error.main' : 'text.secondary' }}
              >
                {isLikedState ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {likesCount}
                </Typography>
              </IconButton>
              
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRepostClick()
                }}
                data-no-navigation
                sx={{ color: isReposted ? 'primary.main' : 'text.secondary' }}
              >
                {isReposted ? <RepeatIcon fontSize="small" /> : <RepeatOutlinedIcon fontSize="small" />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {repostCount}
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
                  {commentsCount}
                </Typography>
              </IconButton>
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

