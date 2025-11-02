'use client'

import { Card, CardContent, Typography, Avatar, IconButton, Box } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { Post } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  isLiked?: boolean
}

export default function PostCard({ post, onLike, isLiked = false }: PostCardProps) {
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
        <Box display="flex" gap={2}>
          <Link href={`/profile/${post.author?.userId}`}>
            <Avatar 
              src={post.author?.image || ''} 
              sx={{ cursor: 'pointer' }}
            >
              {post.author?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Link>
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography 
                variant="subtitle2" 
                component={Link}
                href={`/profile/${post.author?.userId}`}
                sx={{ 
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {post.author?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                @{post.author?.userId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {post.content}
            </Typography>
            
            <Box display="flex" gap={4}>
              <IconButton 
                size="small"
                onClick={() => onLike?.(post.id)}
                sx={{ color: isLiked ? 'primary.main' : 'text.secondary' }}
              >
                {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {post._count?.likes || 0}
                </Typography>
              </IconButton>
              
              <Link href={`/posts/${post.id}`}>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <ChatBubbleOutlineIcon fontSize="small" />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {post._count?.comments || 0}
                  </Typography>
                </IconButton>
              </Link>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

