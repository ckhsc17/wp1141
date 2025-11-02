'use client'

import { useState } from 'react'
import { Button, CircularProgress, Box } from '@mui/material'
import { useFollowStatus, useToggleFollow } from '@/hooks'
import UnfollowConfirmDialog from './UnfollowConfirmDialog'
import { useSession } from 'next-auth/react'

interface FollowButtonProps {
  userId: string
  username: string
}

export default function FollowButton({ userId, username }: FollowButtonProps) {
  const { data: session } = useSession()
  const { data: isFollowing, isLoading } = useFollowStatus(userId, !!session)
  const toggleFollow = useToggleFollow(userId)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const handleButtonClick = () => {
    if (!isFollowing) {
      // 未追蹤，直接執行 follow
      toggleFollow.mutate()
    } else {
      // 已追蹤，開啟確認對話框
      setConfirmDialogOpen(true)
    }
  }

  const handleConfirmUnfollow = () => {
    toggleFollow.mutate()
  }

  if (isLoading) {
    return (
      <Button
        variant="outlined"
        size="small"
        disabled
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          borderRadius: '9999px',
          textTransform: 'none',
          px: 2,
          py: 0.5,
        }}
      >
        <CircularProgress size={16} />
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={handleButtonClick}
        disabled={toggleFollow.isPending}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          borderRadius: '9999px',
          textTransform: 'none',
          px: 2,
          py: 0.5,
          borderColor: isFollowing ? 'text.primary' : 'primary.main',
          color: isFollowing ? 'text.primary' : 'primary.main',
          backgroundColor: isFollowing ? 'background.paper' : 'transparent',
          '&:hover': {
            borderColor: isFollowing ? 'error.main' : 'primary.main',
            color: isFollowing ? 'error.main' : 'primary.main',
            backgroundColor: isFollowing ? 'action.hover' : 'primary.main',
          },
        }}
      >
        {toggleFollow.isPending ? (
          <CircularProgress size={16} sx={{ mr: 1 }} />
        ) : (
          <Box
            sx={{
              '&::before': {
                content: isFollowing ? '"Following"' : '"Follow"',
                position: 'relative',
              },
              '&:hover::before': isFollowing
                ? {
                    content: '"Unfollow"',
                  }
                : {},
            }}
          />
        )}
      </Button>

      <UnfollowConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmUnfollow}
        username={username}
      />
    </>
  )
}

