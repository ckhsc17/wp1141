'use client'

import { AppBar as MuiAppBar, Toolbar, Typography, Button, IconButton, Avatar, Menu, MenuItem, Box } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useThemeMode } from '@/contexts/ThemeContext'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AppBar() {
  const { mode, toggleTheme } = useThemeMode()
  const { data: session } = useSession()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
    handleMenuClose()
  }

  return (
    <MuiAppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end' }}>
        <IconButton onClick={toggleTheme}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        
        {!session && (
          <Button color="primary" variant="contained" onClick={() => signIn()}>
            Sign in
          </Button>
        )}
      </Toolbar>
    </MuiAppBar>
  )
}

