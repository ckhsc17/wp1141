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
      <Toolbar>
        <Link href="/" passHref>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 0,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'text.primary'
            }}
          >
            Twitter Clone
          </Typography>
        </Link>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton onClick={toggleTheme} sx={{ mr: 2 }}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        
        {session ? (
          <>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar src={session.user?.image || ''} sx={{ width: 32, height: 32 }}>
                {session.user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); window.location.href = `/profile/${session.user?.userId}` }}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
            </Menu>
          </>
        ) : (
          <Button color="primary" variant="contained" onClick={() => signIn()}>
            Sign in
          </Button>
        )}
      </Toolbar>
    </MuiAppBar>
  )
}

