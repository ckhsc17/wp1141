'use client'

import { AppBar as MuiAppBar, Toolbar, Typography, Button, IconButton, Avatar, Menu, MenuItem, Box } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useThemeMode } from '@/contexts/ThemeContext'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppBar() {
  const { mode, toggleTheme } = useThemeMode()
  const { data: session } = useSession()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const pathname = usePathname()

  // 登入頁不顯示 header
  if (pathname === '/' && !session?.user) {
    return null
  }

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
        
        {session && session.user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-controls={anchorEl ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={anchorEl ? 'true' : undefined}
            >
              <Avatar src={session.user.image || ''} sx={{ width: 32, height: 32 }}>
                {session.user.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem component={Link} href={session?.user ? `/profile/${(session.user as any).userId}` : '/profile'}>
                <Avatar sx={{ width: 24, height: 24, mr: 1 }} src={session.user.image || ''}>
                  {session.user.name?.charAt(0).toUpperCase()}
                </Avatar>
                個人資料
              </MenuItem>
              <MenuItem onClick={handleSignOut}>
                登出
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button color="primary" variant="contained" onClick={() => signIn()} sx={{ ml: 2 }}>
            Sign in
          </Button>
        )}
      </Toolbar>
    </MuiAppBar>
  )
}

