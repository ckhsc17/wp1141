'use client'

import { useState } from 'react'
import { Paper, Button, Box, Avatar, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { useCreateReply } from '@/hooks'
import { useSession } from 'next-auth/react'
import MentionInput from './MentionInput'
import { calculateEffectiveLength } from '@/utils/mention'

interface ReplyFormProps {
  commentId: string
  postId: string
  onReplyCreated?: () => void
}

export default function ReplyForm({ commentId, postId, onReplyCreated }: ReplyFormProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const createReply = useCreateReply()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return

    try {
      await createReply.mutateAsync({ commentId, postId, content: content.trim() })
      setContent('')
      onReplyCreated?.()
    } catch (error) {
      console.error('Failed to create reply:', error)
    }
  }

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box component="form" onSubmit={handleSubmit} display="flex" gap={2}>
        <Avatar src={session?.user?.image || ''}>
          {session?.user?.name?.charAt(0).toUpperCase()}
        </Avatar>
        
        <Box flex={1}>
          <MentionInput
            fullWidth
            multiline
            rows={3}
            placeholder="Post your reply"
            value={content}
            onChange={setContent}
            variant="standard"
            sx={{ mb: 1 }}
          />
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography 
              variant="caption" 
              color={calculateEffectiveLength(content) > 280 ? 'error' : 'text.secondary'}
            >
              {calculateEffectiveLength(content)}/280
            </Typography>
            <Button
              type="submit"
              variant="contained"
              disabled={!content.trim() || createReply.isPending || calculateEffectiveLength(content) > 280}
              startIcon={<SendIcon />}
            >
              Reply
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

