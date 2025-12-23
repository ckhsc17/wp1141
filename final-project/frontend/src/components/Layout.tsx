import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();

  // 判斷是否為 EventRoom 頁面（/events/:id 但不是 /events 或 /events/new）
  const isEventRoomPage = pathname.match(/^\/events\/\d+$/);
  
  // 判斷是否為 ChatRoom 頁面
  const isChatRoomPage = pathname.startsWith('/chat/');

  // 判斷是否隱藏導航
  const shouldHideNav =
    isEventRoomPage ||
    isChatRoomPage ||
    pathname === '/login' ||
    pathname.startsWith('/invite/');

  if (shouldHideNav) {
    // 全屏模式：只顯示內容
    return <Box sx={{ minHeight: '100vh' }}>{children}</Box>;
  }

  // 判斷是否為 MapView 頁面
  const isMapPage = pathname === '/map';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          // Add padding at bottom when bottom nav is visible (except for map page)
          pb: user && !isMapPage ? { xs: '80px', md: '80px' } : 0,
          // Map page should fill available space
          ...(isMapPage && { height: 'calc(100vh - 64px - 80px)', overflow: 'hidden' }),
        }}
      >
        {children}
      </Box>
      <BottomNav />
    </Box>
  );
}
