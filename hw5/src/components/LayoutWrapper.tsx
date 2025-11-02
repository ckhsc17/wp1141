'use client'

import { Box } from '@mui/material'
import { useSession } from 'next-auth/react'
import AppBar from './AppBar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { data: session } = useSession()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* 登入後顯示 Sidebar */}
      {session && <Sidebar />}

      {/* Main Content */}
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          pb: { xs: 8, md: 0 } // 手機版底部留空間給 BottomNav
        }}
      >
        <AppBar />
        <Box sx={{ flex: 1 }}>
          {children}
        </Box>
      </Box>

      {/* 登入後顯示 BottomNav */}
      {session && <BottomNav />}
    </Box>
  )
}

