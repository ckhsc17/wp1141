'use client'

import { Container, Box, Typography } from '@mui/material'

export default function MessagesPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        Messages
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Coming soon...
      </Typography>
    </Container>
  )
}

