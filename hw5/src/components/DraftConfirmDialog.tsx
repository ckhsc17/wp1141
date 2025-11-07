'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material'

interface DraftConfirmDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  onDiscard: () => void
  isSaving?: boolean
}

export default function DraftConfirmDialog({
  open,
  onClose,
  onSave,
  onDiscard,
  isSaving = false,
}: DraftConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Discard this post?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Do you want to save this as a draft or discard it?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          Save
        </Button>
        <Button onClick={onDiscard} color="error" variant="contained">
          Discard
        </Button>
      </DialogActions>
    </Dialog>
  )
}

