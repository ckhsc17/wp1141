'use client'

import { useState } from 'react'
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Button,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ExploreIcon from '@mui/icons-material/Explore'
import NotificationsIcon from '@mui/icons-material/Notifications'
import MessageIcon from '@mui/icons-material/Message'
import PersonIcon from '@mui/icons-material/Person'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import PostModal from './PostModal'
import { useUnreadNotificationCount } from '@/hooks/useNotification'
import Badge from '@mui/material/Badge'

export default function Sidebar() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(menuAnchorEl)
  const unreadCount = useUnreadNotificationCount()

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
    handleMenuClose()
  }

  const navItems = [
    { label: 'Home', icon: HomeIcon, href: '/', exact: true },
    { label: 'Explore', icon: ExploreIcon, href: '/explore' },
    { label: 'Notifications', icon: NotificationsIcon, href: '/notifications' },
    { label: 'Messages', icon: MessageIcon, href: '/messages' },
    { label: 'Profile', icon: PersonIcon, href: session?.user ? `/profile/${(session.user as any).userId}` : '/profile' },
  ]

  // 桌面版才顯示
  if (isMobile) {
    return null
  }

  return (
    <>
      <Box
        sx={{
          width: 280,
          minHeight: '100vh',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          backgroundColor: '#000000',
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Image 
                src="/favicon.ico" 
                alt="Logo" 
                width={32} 
                height={32}
                style={{ objectFit: 'contain' }}
              />
              <Typography variant="h6" fontWeight="bold">
                Echoo
              </Typography>
            </Box>
          </Link>
        </Box>

        {/* Navigation */}
        <List sx={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href)
            
            return (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    console.log('[Sidebar] Navigation clicked:', { label: item.label, href: item.href })
                    router.push(item.href)
                  }}
                  sx={{
                    borderRadius: '25px',
                    mx: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.label === 'Notifications' && unreadCount.data && unreadCount.data > 0 ? (
                      <Badge badgeContent={unreadCount.data} color="error">
                        <Icon 
                          fontSize="large"
                          sx={{ color: isActive ? 'text.primary' : 'text.secondary' }}
                        />
                      </Badge>
                    ) : (
                      <Icon 
                        fontSize="large"
                        sx={{ color: isActive ? 'text.primary' : 'text.secondary' }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? 'text.primary' : 'text.secondary',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>

        {/* Post Button */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => setPostModalOpen(true)}
            sx={{
              borderRadius: '25px',
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            Post
          </Button>
        </Box>

        {/* User Profile */}
        {session && session.user && (
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar src={session.user.image || ''} sx={{ width: 40, height: 40 }}>
                {session.user.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {session.user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  @{(session.user as any).userId}
                </Typography>
              </Box>
              <IconButton 
                size="small"
                onClick={handleMenuOpen}
                aria-controls={menuOpen ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : undefined}
              >
                <MoreHorizIcon />
              </IconButton>
            </Box>
            
            {/* User Menu */}
            <Menu
              id="user-menu"
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
            >
              <MenuItem 
                component={Link}
                href={session?.user ? `/profile/${(session.user as any).userId}` : '/profile'}
                onClick={handleMenuClose}
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>個人資料</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>設定</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem 
                onClick={handleSignOut}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText>登出</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>

      <PostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} />
    </>
  )
}

