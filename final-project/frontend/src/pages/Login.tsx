import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import { 
  Google as GoogleIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { LogIn } from 'lucide-react';
import api from '../api/axios';

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = () => {
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  };

  const handleGitHubLogin = () => {
    window.location.href = `${api.defaults.baseURL}/auth/github`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: 'white',
            p: 4,
            borderRadius: '2rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.025em',
                mb: 1,
              }}
            >
              MeetHalf
            </Typography>
            <Typography
              sx={{
                color: '#94a3b8',
                fontSize: '0.875rem',
                fontWeight: 500,
                mb: 3,
              }}
            >
              Where's the squad?
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 4 }}
            >
              登入失敗，請稍後再試
            </Alert>
          )}

          {/* OAuth Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleGoogleLogin}
              startIcon={<GoogleIcon />}
              sx={{
                py: 1.5,
                fontSize: '0.875rem',
                fontWeight: 700,
                bgcolor: '#4285F4',
                color: 'white',
                borderRadius: 3,
                textTransform: 'none',
                boxShadow: '0 4px 12px -2px rgba(66, 133, 244, 0.3)',
                '&:hover': {
                  bgcolor: '#357AE8',
                  boxShadow: '0 6px 16px -2px rgba(66, 133, 244, 0.4)',
                },
                transition: 'all 0.2s ease',
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              使用 Google 登入
            </Button>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleGitHubLogin}
              startIcon={<GitHubIcon />}
              sx={{
                py: 1.5,
                fontSize: '0.875rem',
                fontWeight: 700,
                bgcolor: '#24292e',
                color: 'white',
                borderRadius: 3,
                textTransform: 'none',
                boxShadow: '0 4px 12px -2px rgba(36, 41, 46, 0.3)',
                '&:hover': {
                  bgcolor: '#1a1e22',
                  boxShadow: '0 6px 16px -2px rgba(36, 41, 46, 0.4)',
                },
                transition: 'all 0.2s ease',
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              使用 GitHub 登入
            </Button>
          </Box>

          {/* Info Text */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                fontWeight: 500,
              }}
            >
              💡 未登入也可以使用！直接前往活動頁面即可開始使用
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

