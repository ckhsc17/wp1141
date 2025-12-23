import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Badge } from '@mui/material';
import { Home, Users, Plus, Map, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  isCreate?: boolean;
}

const navItems: NavItem[] = [
  {
    path: '/events',
    icon: <Home size={20} />,
  },
  {
    path: '/friends',
    icon: <Users size={20} />,
  },
  {
    path: '/events/new',
    icon: <Plus size={24} />,
    isCreate: true,
  },
  {
    path: '/map',
    icon: <Map size={20} />,
  },
  {
    path: '/profile',
    icon: <User size={20} />,
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useChat(user?.userId ?? undefined);

  const isActive = (path: string) => {
    if (path === '/events') {
      return location.pathname === '/events' || location.pathname === '/';
    }
    if (path === '/friends') {
      return location.pathname.startsWith('/friends') || location.pathname.startsWith('/social');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid',
        borderColor: 'rgba(241, 245, 249, 1)',
        px: 4,
        py: 2,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.path);

        if (item.isCreate) {
          return (
            <Box
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 4,
                bgcolor: '#2563eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              {item.icon}
            </Box>
          );
        }

        const shouldShowBadge = item.path === '/friends' && unreadCount > 0;

        return (
          <Box
            key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 4,
              bgcolor: active ? '#2563eb' : 'white',
              color: active ? 'white' : '#64748b',
              boxShadow: active
                ? '0 4px 12px rgba(37, 99, 235, 0.3)'
                : '0 1px 3px rgba(0,0,0,0.05)',
              border: active ? 'none' : '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              '&:active': {
                transform: 'scale(0.9)',
              },
            }}
          >
            {shouldShowBadge ? (
              <Badge
                badgeContent={unreadCount}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    height: '16px',
                    minWidth: '16px',
                    padding: '0 4px',
                  },
                }}
              >
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )}
          </Box>
        );
      })}
    </Box>
  );
}
