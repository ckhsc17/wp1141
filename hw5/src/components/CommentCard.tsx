'use client'

import { Card, CardContent, Typography, Avatar, IconButton, Box, Link } from '@mui/material'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import DeleteIcon from '@mui/icons-material/Delete'
import { Comment } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDeleteComment } from '@/hooks'

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
  
  const isOwner = session?.user?.id === comment.authorId
  
  const handleClick = () => {
    if (clickable) {
      router.push(`/posts/${postId}?commentId=${comment.id}`)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('確定要刪除此留言嗎？')) {
      try {
        await deleteComment.mutateAsync(comment.id)
        onDelete?.()
      } catch (error) {
        console.error('Failed to delete comment:', error)
      }
    }
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
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
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
            
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {comment.content}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={4}>
              <IconButton 
                size="small" 
                sx={{ color: 'text.secondary' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
              >
                <ChatBubbleOutlineIcon fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {comment._count?.replies || 0}
                </Typography>
              </IconButton>
              
              {isOwner && (
                <IconButton 
                  size="small" 
                  sx={{ color: 'text.secondary' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

