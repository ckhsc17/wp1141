'use client'

import { Button, Box, Divider, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import GitHubIcon from '@mui/icons-material/GitHub'
import FacebookIcon from '@mui/icons-material/Facebook'
import { signIn } from 'next-auth/react'

export default function AuthButtons() {
  const handleSignIn = (provider: string) => {
    signIn(provider)
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Button
        fullWidth
        variant="contained"
        size="large"
        startIcon={<GoogleIcon />}
        onClick={() => handleSignIn('google')}
        sx={{
          mb: 2,
          backgroundColor: '#DB4437',
          '&:hover': {
            backgroundColor: '#C23321',
          },
        }}
      >
        使用 Google 登入
      </Button>

      <Button
        fullWidth
        variant="contained"
        size="large"
        startIcon={<GitHubIcon />}
        onClick={() => handleSignIn('github')}
        sx={{
          mb: 2,
          backgroundColor: '#333',
          '&:hover': {
            backgroundColor: '#2a2a2a',
          },
        }}
      >
        使用 GitHub 登入
      </Button>

      <Button
        fullWidth
        variant="contained"
        size="large"
        startIcon={<FacebookIcon />}
        onClick={() => handleSignIn('facebook')}
        sx={{
          mb: 2,
          backgroundColor: '#4267B2',
          '&:hover': {
            backgroundColor: '#365899',
          },
        }}
      >
        使用 Facebook 登入
      </Button>

      <Divider sx={{ my: 2 }} />

      <Typography 
        variant="caption" 
        color="text.secondary" 
        align="center" 
        display="block"
        sx={{ fontSize: '0.75rem' }}
      >
        登入即表示您同意我們的服務條款和隱私政策
      </Typography>
    </Box>
  )
}

