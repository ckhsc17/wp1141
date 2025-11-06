'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  DialogActions,
} from '@mui/material'
import { useThemeMode } from '@/contexts/ThemeContext'

interface UnrepostConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function UnrepostConfirmDialog({
  open,
  onClose,
  onConfirm,
}: UnrepostConfirmDialogProps) {
  const { mode } = useThemeMode()
  const isDark = mode === 'dark'

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: isDark ? 'rgba(22, 24, 28, 1)' : 'rgba(255, 255, 255, 1)',
        },
      }}
    >
      <DialogTitle sx={{ pt: 3, pb: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.25rem' }}>
          Undo repost?
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          This will remove the repost from your profile. The original post will remain.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 0, flexDirection: 'column' }}>
        <Box sx={{ width: '100%', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            onClick={handleConfirm}
            sx={{
              py: 2,
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 0,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              backgroundColor: isDark ? 'rgba(239, 243, 244, 1)' : 'rgba(15, 20, 25, 1)',
              color: isDark ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(239, 243, 244, 0.9)' : 'rgba(15, 20, 25, 0.9)',
              },
            }}
          >
            Undo repost
          </Button>
        </Box>
        <Box sx={{ width: '100%', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            onClick={onClose}
            sx={{
              py: 2,
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 0,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

