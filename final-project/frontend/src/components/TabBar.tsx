import { BottomNavigation, BottomNavigationAction, Badge, Paper } from '@mui/material';
import { Event as EventIcon, People as PeopleIcon, Person as PersonIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useNotifications } from '../hooks/useNotifications';

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get unread counts
  const { unreadCount: chatUnreadCount } = useChat(user?.userId);
  const { unreadCount: notificationUnreadCount } = useNotifications(user?.userId);

  // Don't show tab bar if user is not logged in
  if (!user) {
    return null;
  }

  // Determine current tab based on location
  const getCurrentTab = () => {
    if (location.pathname.startsWith('/events')) return '/events';
    if (location.pathname.startsWith('/friends') || location.pathname.startsWith('/chat')) return '/friends';
    if (location.pathname.startsWith('/profile')) return '/profile';
    return '/events';
  };

  const currentTab = getCurrentTab();

  // Calculate total unread for friends tab (chat + friend requests)
  const friendsUnreadCount = chatUnreadCount;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: { xs: 'block', md: 'none' }, // Only show on mobile
      }}
      elevation={3}
    >
      <BottomNavigation
        value={currentTab}
        onChange={(event, newValue) => {
          navigate(newValue);
        }}
        showLabels
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px 8px',
          },
        }}
      >
        <BottomNavigationAction
          label="活動"
          value="/events"
          icon={
            <Badge badgeContent={0} color="error">
              <EventIcon />
            </Badge>
          }
        />
        <BottomNavigationAction
          label="好友"
          value="/friends"
          icon={
            <Badge badgeContent={friendsUnreadCount} color="error" max={99}>
              <PeopleIcon />
            </Badge>
          }
        />
        <BottomNavigationAction
          label="個人"
          value="/profile"
          icon={<PersonIcon />}
          disabled // Temporarily disabled until profile page is implemented
        />
      </BottomNavigation>
    </Paper>
  );
}

