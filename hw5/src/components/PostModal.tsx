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
import { useCreatePost, useDraft, useSaveDraft, useDeleteDraft } from '@/hooks'
import MentionInput from './MentionInput'

interface PostModalProps {
  open: boolean
  onClose: () => void
}

export default function PostModal({ open, onClose }: PostModalProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const createPost = useCreatePost()
  const { data: draft } = useDraft()
  const saveDraft = useSaveDraft()
  const deleteDraft = useDeleteDraft()
  const [hasDraft, setHasDraft] = useState(false)

  // 載入草稿
  useEffect(() => {
    if (open && draft) {
      setContent(draft.content)
      setHasDraft(true)
    } else if (open && !draft) {
      setContent('')
      setHasDraft(false)
    }
  }, [open, draft])

  // 關閉時重置
  useEffect(() => {
    if (!open) {
      setContent('')
      setHasDraft(false)
    }
  }, [open])

  const handleClose = () => {
    // 如果有內容且未發布，自動儲存為草稿
    if (content.trim() && !hasDraft) {
      saveDraft.mutate(content.trim())
    }
    onClose()
  }

  const handlePost = async () => {
    if (!content.trim()) return

    try {
      await createPost.mutateAsync({ content: content.trim() })
      // 發布成功後刪除草稿
      if (hasDraft && draft) {
        await deleteDraft.mutateAsync()
      }
      onClose()
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const handleSaveDraft = async () => {
    if (!content.trim()) return

    try {
      await saveDraft.mutateAsync(content.trim())
      setHasDraft(true)
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
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
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 3 }}>
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
              inputProps={{
                maxLength: 280,
              }}
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
                  <Typography variant="caption" color="text.secondary">
                    {content.length}/280
                  </Typography>
                )}
                <Button
                  onClick={handleSaveDraft}
                  disabled={!content.trim() || saveDraft.isPending}
                  size="small"
                >
                  Save as draft
                </Button>
                <Button
                  onClick={handlePost}
                  variant="contained"
                  disabled={!content.trim() || createPost.isPending}
                  size="small"
                >
                  {createPost.isPending ? 'Posting...' : 'Post'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

