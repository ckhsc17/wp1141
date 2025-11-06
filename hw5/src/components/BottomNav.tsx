'use client'

import { useState } from 'react'
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ExploreIcon from '@mui/icons-material/Explore'
import NotificationsIcon from '@mui/icons-material/Notifications'
import MessageIcon from '@mui/icons-material/Message'
import PersonIcon from '@mui/icons-material/Person'
import AddIcon from '@mui/icons-material/Add'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PostModal from './PostModal'
import { useRouter } from 'next/navigation'
import { useUnreadNotificationCount } from '@/hooks/useNotification'
import Badge from '@mui/material/Badge'

export default function BottomNav() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [postModalOpen, setPostModalOpen] = useState(false)
  const unreadCount = useUnreadNotificationCount()

  const navItems = [
    { label: 'Home', icon: HomeIcon, href: '/' },
    { label: 'Explore', icon: ExploreIcon, href: '/explore' },
    { label: 'Notifications', icon: NotificationsIcon, href: '/notifications' },
    { label: 'Messages', icon: MessageIcon, href: '/messages' },
    { label: 'Profile', icon: PersonIcon, href: session?.user ? `/profile/${(session.user as any).userId}` : '/profile' },
  ]

  // 桌面版不顯示
  if (isDesktop) {
    return null
  }

  // Find current active tab index
  const currentIndex = navItems.findIndex(
    (item) => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
  )
  const [value, setValue] = useState(currentIndex >= 0 ? currentIndex : 0)

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
    if (navItems[newValue]) {
      router.push(navItems[newValue].href)
    }
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <BottomNavigation
          value={value}
          onChange={handleChange}
          sx={{
            '& .MuiBottomNavigationAction-root': {
              color: 'text.secondary',
              minWidth: 60,
              maxWidth: 'auto',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          {navItems.map((item, index) => {
            const isNotification = item.label === 'Notifications'
            const showBadge = isNotification && unreadCount.data && unreadCount.data > 0
            
            return (
              <BottomNavigationAction
                key={item.label}
                label={item.label}
                icon={
                  showBadge ? (
                    <Badge badgeContent={unreadCount.data} color="error">
                      <item.icon />
                    </Badge>
                  ) : (
                    <item.icon />
                  )
                }
                value={index}
              />
            )
          })}
        </BottomNavigation>
      </Box>

      {/* Floating Post Button */}
      <Fab
        color="primary"
        aria-label="post"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 999,
        }}
        onClick={() => setPostModalOpen(true)}
      >
        <AddIcon />
      </Fab>

      <PostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} />
    </>
  )
}

