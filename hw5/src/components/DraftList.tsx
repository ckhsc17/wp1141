'use client'

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Tooltip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Draft } from '@/hooks/useDraft'
import { formatDistanceToNow } from 'date-fns'

interface DraftListProps {
  drafts: Draft[]
  onSelect: (draft: Draft) => void
  onDelete: (draft: Draft) => void
  onBack: () => void
}

export default function DraftList({ drafts, onSelect, onDelete, onBack }: DraftListProps) {
  return (
    <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <IconButton size="small" onClick={onBack}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600}>
          Drafts
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ({drafts.length})
        </Typography>
      </Box>

      {drafts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          You don't have any drafts yet.
        </Typography>
      ) : (
        <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {drafts.map((draft) => (
            <ListItem
              key={draft.id}
              secondaryAction={
                <Tooltip title="Delete draft">
                  <IconButton edge="end" onClick={() => onDelete(draft)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
              disablePadding
            >
              <ListItemButton onClick={() => onSelect(draft)} alignItems="flex-start">
                <ListItemText
                  primary={draft.content.substring(0, 80) || '(Empty draft)'}
                  secondary={formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: {
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                    },
                  }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}

