'use client'

import { Button, Box, Divider, Typography, Link } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import GitHubIcon from '@mui/icons-material/GitHub'
import FacebookIcon from '@mui/icons-material/Facebook'
import { signIn } from 'next-auth/react'
import NextLink from 'next/link'

export default function AuthButtons() {
  const handleSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/' })
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
        使用 Google 繼續
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
        使用 GitHub 繼續
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
        使用 Facebook 繼續
      </Button>

      <Divider sx={{ my: 2 }} />

      <Typography 
        variant="caption" 
        color="text.secondary" 
        align="center"
        display="block"
        sx={{ fontSize: '0.75rem' }}
      >
        登入即表示您同意我們的{' '}
        <Link component={NextLink} href="/terms" sx={{ textDecoration: 'none' }}>
          服務條款
        </Link>
        {' '}和{' '}
        <Link component={NextLink} href="/privacy" sx={{ textDecoration: 'none' }}>
          隱私政策
        </Link>
      </Typography>
    </Box>
  )
}

