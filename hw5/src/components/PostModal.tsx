'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Button, 
  Box, 
  Avatar, 
  Typography,
  Chip
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ImageIcon from '@mui/icons-material/Image'
import { useSession } from 'next-auth/react'
import { 
  useCreatePost, 
  useDrafts, 
  useCreateDraft, 
  useUpdateDraft, 
  useDeleteDraft 
} from '@/hooks'
import MentionInput from './MentionInput'
import { calculateEffectiveLength } from '@/utils/mention'
import DraftConfirmDialog from './DraftConfirmDialog'
import DraftList from './DraftList'

interface PostModalProps {
  open: boolean
  onClose: () => void
}

export default function PostModal({ open, onClose }: PostModalProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const createPost = useCreatePost()
  const { data: drafts, isLoading: draftsLoading } = useDrafts()
  const createDraft = useCreateDraft()
  const updateDraft = useUpdateDraft()
  const deleteDraft = useDeleteDraft()
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  const [showDraftList, setShowDraftList] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setContent('')
      setActiveDraftId(null)
      setShowDraftList(false)
      setConfirmOpen(false)
    }
  }, [open])

  const handleAttemptClose = () => {
    if (content.trim().length > 0) {
      setConfirmOpen(true)
    } else {
      onClose()
    }
  }

  const handleDialogClose = (
    _event: unknown,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      handleAttemptClose()
    }
  }

  const handlePost = async () => {
    if (!content.trim()) return

    try {
      await createPost.mutateAsync({ content: content.trim() })
      // 發布成功後刪除草稿
      if (activeDraftId) {
        await deleteDraft.mutateAsync(activeDraftId)
      }
      onClose()
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const handleSaveDraft = async () => {
    if (!content.trim()) return

    try {
      if (activeDraftId) {
        await updateDraft.mutateAsync({ id: activeDraftId, content: content.trim() })
      } else {
        const newDraft = await createDraft.mutateAsync(content.trim())
        setActiveDraftId(newDraft.id)
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  const handleConfirmSave = async () => {
    try {
      await handleSaveDraft()
      setConfirmOpen(false)
      setContent('')
      setActiveDraftId(null)
      setShowDraftList(false)
      onClose()
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  const handleConfirmDiscard = () => {
    setConfirmOpen(false)
    setContent('')
    setActiveDraftId(null)
    setShowDraftList(false)
    onClose()
  }

  const handleSelectDraft = (draft: { id: string; content: string }) => {
    setActiveDraftId(draft.id)
    setContent(draft.content)
    setShowDraftList(false)
  }

  const handleDeleteDraftFromList = async (draft: { id: string }) => {
    try {
      await deleteDraft.mutateAsync(draft.id)
      if (draft.id === activeDraftId) {
        setActiveDraftId(null)
        setContent('')
      }
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }

  const hasDraft = Boolean(activeDraftId)
  const hasContent = content.trim().length > 0
  const confirmSaving = createDraft.isPending || updateDraft.isPending

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose}
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
          <Box display="flex" alignItems="center" gap={1}>
            {hasDraft && (
              <Chip 
                label="Draft" 
                size="small" 
                color="primary"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
              <Button
                size="small"
                onClick={() => setShowDraftList(true)}
                disabled={draftsLoading}
              >
                Drafts
              </Button>
          </Box>
          <IconButton onClick={handleAttemptClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 3 }}>
        {showDraftList ? (
          <DraftList
            drafts={drafts || []}
            onSelect={handleSelectDraft}
            onDelete={handleDeleteDraftFromList}
            onBack={() => setShowDraftList(false)}
          />
        ) : (
          <Box display="flex" gap={2}>
            <Avatar src={session?.user?.image || ''}>
              {session?.user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box flex={1}>
              <MentionInput
                fullWidth
                multiline
                rows={8}
                placeholder="What's happening?"
                value={content}
                onChange={setContent}
                variant="standard"
                autoFocus
                sx={{ mb: 2 }}
              />
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Box display="flex" gap={1}>
                  <IconButton disabled size="small">
                    <ImageIcon fontSize="small" />
                  </IconButton>
                  {/* 未來擴充其他媒體選項 */}
                </Box>
                
                <Box display="flex" gap={1} alignItems="center">
                  {content.length > 0 && (
                    <Typography 
                      variant="caption" 
                      color={calculateEffectiveLength(content) > 280 ? 'error' : 'text.secondary'}
                    >
                      {calculateEffectiveLength(content)}/280
                    </Typography>
                  )}
                  <Button
                    onClick={handleSaveDraft}
                    disabled={!hasContent || confirmSaving}
                    size="small"
                  >
                    Save as draft
                  </Button>
                  <Button
                    onClick={handlePost}
                    variant="contained"
                    disabled={!hasContent || createPost.isPending || calculateEffectiveLength(content) > 280}
                    size="small"
                  >
                    {createPost.isPending ? 'Posting...' : 'Post'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DraftConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onSave={handleConfirmSave}
        onDiscard={handleConfirmDiscard}
        isSaving={confirmSaving}
      />
    </Dialog>
  )
}

