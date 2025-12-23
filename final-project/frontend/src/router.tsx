import { createBrowserRouter, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import InvitePage from './pages/InvitePage';
import Social from './pages/Social';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import ChatRoom from './pages/ChatRoom';
import Notifications from './pages/Notifications';
import FirstTimeSetup from './pages/FirstTimeSetup';
import { Box, CircularProgress } from '@mui/material';

// Root layout that wraps all routes
function RootLayout() {
  return <Outlet />;
}

// Redirect helper that preserves query parameters
function RedirectToEvents() {
  const location = useLocation();
  return <Navigate to={`/events${location.search}`} replace />;
}

// Loading Route wrapper
function LoadingRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

// 404 Page - only shows for truly invalid routes
function NotFoundPage() {
  return (
    <Layout>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <h1>404 - 頁面不存在</h1>
        <p>您訪問的頁面不存在</p>
      </Box>
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <RedirectToEvents />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/first-time-setup',
        element: <FirstTimeSetup />,
      },
      {
        path: '/invite/:token',
        element: <InvitePage />,
      },
      {
        path: '/events',
        element: (
          <LoadingRoute>
            <Events />
          </LoadingRoute>
        ),
      },
      {
        path: '/events/new',
        element: (
          <LoadingRoute>
            <CreateEvent />
          </LoadingRoute>
        ),
      },
      {
        path: '/events/:id',
        element: (
          <LoadingRoute>
            <EventDetail />
          </LoadingRoute>
        ),
      },
      {
        path: '/social',
        element: <Navigate to="/friends" replace />,
      },
      {
        path: '/friends',
        element: (
          <LoadingRoute>
            <Friends />
          </LoadingRoute>
        ),
      },
      {
        path: '/map',
        element: (
          <LoadingRoute>
            <MapView />
          </LoadingRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <LoadingRoute>
            <Profile />
          </LoadingRoute>
        ),
      },
      {
        path: '/chat/:type/:id',
        element: (
          <LoadingRoute>
            <ChatRoom />
          </LoadingRoute>
        ),
      },
      {
        path: '/notifications',
        element: (
          <LoadingRoute>
            <Notifications />
          </LoadingRoute>
        ),
      },
      {
        path: '/groups',
        element: <Navigate to="/events" replace />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
