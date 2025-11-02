'use client'

import { Container, Box, Typography } from '@mui/material'

export default function ExplorePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        Explore
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Coming soon...
      </Typography>
    </Container>
  )
}

