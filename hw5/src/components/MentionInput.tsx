'use client'

import { useState, useRef, useEffect } from 'react'
import { TextField, TextFieldProps, Box, Paper, List, ListItemButton, ListItemAvatar, ListItemText, Avatar, Typography } from '@mui/material'
import { useUserSearch } from '@/hooks'

interface MentionInputProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

interface MentionState {
  show: boolean
  start: number
  end: number
  query: string
  cursor: number
}

export default function MentionInput({ value, onChange, ...textFieldProps }: MentionInputProps) {
  const [mentionState, setMentionState] = useState<MentionState | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const { data: suggestions = [], isLoading } = useUserSearch(mentionState?.query || '', !!mentionState?.show)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionState?.show &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setMentionState(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mentionState?.show])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart || 0
    
    onChange(newValue)

    // Check if the user is typing an @mention
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    // Check if @ is followed by whitespace or newline (not a mention)
    if (atIndex === -1 || textBeforeCursor[atIndex + 1]?.match(/[\s\n]/)) {
      setMentionState(null)
      return
    }

    // Extract the query after @
    const textAfterAt = textBeforeCursor.substring(atIndex + 1)
    const query = textAfterAt.replace(/[\s\n]/g, '')

    // If query is empty (only whitespace), don't show suggestions
    if (!query) {
      setMentionState(null)
      return
    }

    // Find the actual end position (before any whitespace)
    const actualEnd = atIndex + 1 + query.length

    setMentionState({
      show: true,
      start: atIndex,
      end: actualEnd,
      query,
      cursor: cursorPosition,
    })
  }

  const handleSuggestionClick = (username: string) => {
    if (!mentionState) return

    const before = value.substring(0, mentionState.start)
    const after = value.substring(mentionState.end)
    const newValue = `${before}@${username} ${after}`
    
    onChange(newValue)
    setMentionState(null)

    // Set cursor position after the inserted mention
    setTimeout(() => {
      const newPosition = mentionState.start + username.length + 2 // +2 for @ and space
      inputRef.current?.setSelectionRange(newPosition, newPosition)
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <Box position="relative">
      <TextField
        {...textFieldProps}
        value={value}
        onChange={handleChange}
        inputRef={inputRef}
      />

      {mentionState?.show && (
        <Box
          ref={suggestionsRef}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 0.5,
          }}
        >
          <Paper elevation={3}>
            {isLoading && (
              <Box p={2}>
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            )}
            
            {!isLoading && suggestions.length === 0 && mentionState.query && (
              <Box p={2}>
                <Typography variant="body2" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            )}

            {suggestions.length > 0 && (
              <List dense>
                {suggestions.map((user) => (
                  <ListItemButton
                    key={user.id}
                    onClick={() => handleSuggestionClick(user.userId)}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.image || ''} sx={{ width: 32, height: 32 }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={`@${user.userId}`}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  )
}

