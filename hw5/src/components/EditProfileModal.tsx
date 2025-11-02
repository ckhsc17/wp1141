'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Box,
  Avatar,
  Typography,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useSession } from 'next-auth/react'
import { User } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, UpdateProfileInput } from '@/schemas/user.schema'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
  user: User
}

export default function EditProfileModal({ open, onClose, user }: EditProfileModalProps) {
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  })

  const watchedBio = watch('bio')

  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name,
        bio: user.bio || '',
      })
      setError(null)
    }
  }, [open, user, reset])

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      setIsSubmitting(true)
      setError(null)

      await axios.put('/api/users/profile', data)
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      
      // Update session
      await update()
      
      onClose()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || '更新失敗，請稍後再試')
      } else {
        setError('發生未知錯誤')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Edit profile</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              fullWidth
              label="Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={isSubmitting}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Bio"
              {...register('bio')}
              error={!!errors.bio}
              helperText={
                errors.bio?.message ||
                (watchedBio && `${watchedBio.length}/200`)
              }
              disabled={isSubmitting}
              inputProps={{
                maxLength: 200,
              }}
            />

            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  )
}

