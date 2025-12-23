import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Search, X, UserPlus } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';

interface AddFriendDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AddFriendDrawer({ open, onClose }: AddFriendDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const { searchResults, loading, searchUsers, sendRequest } = useFriends();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery.trim());
    }
  };

  const handleSendRequest = async (userId: string, userName: string) => {
    const success = await sendRequest(userId);
    if (success) {
      setSnackbarMessage(`已向 ${userName} 發送好友邀請`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage('發送邀請失敗，請稍後再試');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            bgcolor: '#f8fafc',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'white',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a' }}>
              加入好友
            </Typography>
            <Box
              onClick={handleClose}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              <X size={20} />
            </Box>
          </Box>

          {/* Search Input */}
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #f1f5f9' }}>
            <TextField
              fullWidth
              placeholder="搜尋用戶 ID 或名稱"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} style={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  bgcolor: '#f1f5f9',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
            <Button
              fullWidth
              onClick={handleSearch}
              disabled={!searchQuery.trim() || loading}
              sx={{
                mt: 2,
                borderRadius: 4,
                bgcolor: '#2563eb',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                py: 1.5,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1d4ed8' },
                '&:disabled': {
                  bgcolor: '#e2e8f0',
                  color: '#94a3b8',
                },
              }}
            >
              搜尋
            </Button>
          </Box>

          {/* Search Results */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : searchResults.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {searchResults.map((user) => (
                  <Box
                    key={user.userId}
                    sx={{
                      bgcolor: 'white',
                      p: 2,
                      borderRadius: '1.5rem',
                      border: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar
                      src={user.avatar || undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: '#dbeafe',
                        fontSize: '1.25rem',
                        borderRadius: 4,
                        color: '#2563eb',
                        fontWeight: 700,
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                        {user.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                        {user.userId}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<UserPlus size={18} />}
                      onClick={() => handleSendRequest(user.userId, user.name)}
                      sx={{
                        borderRadius: 3,
                        bgcolor: '#2563eb',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        px: 2,
                        py: 1,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#1d4ed8' },
                      }}
                    >
                      邀請
                    </Button>
                  </Box>
                ))}
              </Box>
            ) : searchQuery ? (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '1rem', mb: 1 }}>
                  找不到符合的用戶
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  請嘗試其他關鍵字
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '1rem', mb: 1 }}>
                  搜尋用戶
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  輸入用戶 ID 或名稱來搜尋
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

