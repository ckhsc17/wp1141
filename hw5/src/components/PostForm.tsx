'use client'

import { useState } from 'react'
import { Paper, Button, Box, Avatar, Typography, CircularProgress } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { useCreatePost } from '@/hooks/usePosts'
import { useSession } from 'next-auth/react'
import MentionInput from './MentionInput'
import { calculateEffectiveLength } from '@/utils/mention'

interface PostFormProps {
  onPostCreated?: () => void
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const createPost = useCreatePost()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return

    try {
      await createPost.mutateAsync({ content: content.trim() })
      setContent('')
      onPostCreated?.()
    } catch (error) {
      console.error('Failed to create post:', error)
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
            placeholder="What's happening?"
            value={content}
            onChange={setContent}
            variant="standard"
            sx={{ mb: 1 }}
          />
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {content.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {calculateEffectiveLength(content)}/280
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={!content.trim() || createPost.isPending || calculateEffectiveLength(content) > 280}
              startIcon={createPost.isPending ? <CircularProgress size={20} /> : <SendIcon />}
            >
              {createPost.isPending ? 'Posting...' : 'Post'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

