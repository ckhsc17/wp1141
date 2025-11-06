'use client'

import { useState } from 'react'
import { Container, Box, Typography, CircularProgress, Alert, Avatar, Paper } from '@mui/material'
import { useNotifications, usePusherNotifications } from '@/hooks/useNotification'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import FavoriteIcon from '@mui/icons-material/Favorite'
import CommentIcon from '@mui/icons-material/Comment'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import Link from 'next/link'
import { Notification } from '@/types'

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, error } = useNotifications(page, limit)
  
  // Listen for Pusher notifications
  usePusherNotifications((session?.user as any)?.userId)

  console.log('[NotificationsPage] Component rendered:', {
    hasSession: !!session,
    userId: (session?.user as any)?.userId,
    data,
    isLoading,
    error,
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <FavoriteIcon sx={{ color: 'error.main' }} />
      case 'comment':
        return <CommentIcon sx={{ color: 'primary.main' }} />
      case 'mention':
        return <AlternateEmailIcon sx={{ color: 'primary.main' }} />
      default:
        return null
    }
  }

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor?.name || 'Someone'
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`
      case 'comment':
        return `${actorName} commented on your post`
      case 'mention':
        return `${actorName} mentioned you`
      default:
        return 'New notification'
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.postId) {
      return `/posts/${notification.postId}`
    }
    return '/'
  }

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          Failed to load notifications
        </Alert>
      </Container>
    )
  }

  const notifications = data?.data || []

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Notifications
      </Typography>

      {!isLoading && notifications.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          No notifications yet
        </Typography>
      )}

      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href={getNotificationLink(notification)}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Paper
            sx={{
              p: 2,
              mb: 1,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              cursor: 'pointer',
            }}
          >
            <Box display="flex" gap={2} alignItems="flex-start">
              <Avatar src={notification.actor?.image || ''}>
                {notification.actor?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  {getNotificationIcon(notification.type)}
                  <Typography variant="body2" fontWeight={600}>
                    {getNotificationText(notification)}
                  </Typography>
                </Box>
                {notification.post && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 0.5,
                    }}
                  >
                    {notification.post.content}
                  </Typography>
                )}
                {notification.comment && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 0.5,
                    }}
                  >
                    {notification.comment.content}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Link>
      ))}
    </Container>
  )
}
