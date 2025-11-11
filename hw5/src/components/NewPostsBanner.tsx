'use client'

import { Alert, Button, Box } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

interface NewPostsBannerProps {
  count: number
  onLoadNew: () => void
}

export default function NewPostsBanner({ count, onLoadNew }: NewPostsBannerProps) {
  if (count === 0) return null

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        mb: 2,
      }}
    >
      <Alert
        severity="info"
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onLoadNew}
          >
            Load
          </Button>
        }
        sx={{
          borderRadius: 0,
          '& .MuiAlert-message': {
            flex: 1,
          },
        }}
      >
        {count} new {count === 1 ? 'post' : 'posts'} available
      </Alert>
    </Box>
  )
}

