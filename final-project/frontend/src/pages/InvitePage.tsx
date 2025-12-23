import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Share as ShareIcon,
  ArrowForward as ArrowForwardIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { inviteApi } from '../api/events';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);
  const [shareToken, setShareToken] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setError('無效的邀請連結');
      setLoading(false);
      return;
    }

    // Resolve token to event ID
    const resolveToken = async () => {
      try {
        const response = await inviteApi.resolveInviteToken(token);
        setEventId(response.eventId);
        setShareToken(token); // Store the share token for display
        setLoading(false);
      } catch (err: any) {
        console.error('[InvitePage] Error resolving invite token:', err);
        setError(err.response?.data?.message || err.message || '無法解析邀請連結，請確認連結是否正確');
        setLoading(false);
      }
    };

    resolveToken();
  }, [token]);

  const handleGoToEvent = () => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(shareToken);
      setSnackbarMessage('邀請碼已複製！');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage('複製失敗');
      setSnackbarOpen(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/events')} fullWidth>
          返回聚會列表
        </Button>
      </Container>
    );
  }

  // Show PWA installation guide
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ShareIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            將 MeetHalf 加入主畫面
          </Typography>
          <Typography variant="body1" color="text.secondary">
            為了獲得最佳體驗並接收即時通知，請將 MeetHalf 加入主畫面
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom fontWeight={600}>
          如何加入主畫面：
        </Typography>

        {/* iOS Safari instructions */}
        {/iPhone|iPad|iPod/.test(navigator.userAgent) ? (
          <Box sx={{ mt: 3 }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary.main">
                    1
                  </Typography>
                </ListItemIcon>
                <ListItemText
                  primary="點擊底部的分享按鈕（方塊與向上箭頭圖示）"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary.main">
                    2
                  </Typography>
                </ListItemIcon>
                <ListItemText
                  primary="向下滾動並選擇「加入主畫面」或「加入主畫面螢幕」"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary.main">
                    3
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="確認後，應用程式圖示會出現在主畫面上" />
              </ListItem>
            </List>
          </Box>
        ) : (
          /* Android Chrome instructions */
          <Box sx={{ mt: 3 }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary.main">
                    1
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="點擊瀏覽器右上角的三點選單" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary.main">
                    2
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="選擇「加到主畫面」或「安裝應用程式」" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary.main">
                    3
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="確認後，應用程式圖示會出現在主畫面上" />
              </ListItem>
            </List>
          </Box>
        )}

        {/* PWA 使用說明 */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
            加入主畫面後的使用方式：
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
            • 首次打開 PWA 後，請在主頁面輸入邀請碼：
          </Typography>
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              borderRadius: 1,
              mb: 1,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'primary.main',
                letterSpacing: '0.05em',
                flex: 1,
                minWidth: 0, // 允許 flex item 縮小
                wordBreak: 'break-all', // 允許在任何字符處換行
                overflowWrap: 'break-word', // 更好的換行處理
              }}
            >
              {shareToken}
            </Typography>
            <IconButton
              onClick={handleCopyToken}
              size="small"
              sx={{
                color: 'primary.main',
                flexShrink: 0, // 防止按鈕被壓縮
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2">
            • 之後即可接收即時通知，並通過通知直接打開活動
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary', fontStyle: 'italic' }}>
            提示：也可以不安裝 PWA，直接點擊下方按鈕立即加入活動
          </Typography>
        </Alert>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/events')}
            sx={{ textTransform: 'none' }}
          >
            稍後再說
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleGoToEvent}
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: 'none' }}
          >
            立即前往聚會
          </Button>
        </Box>
      </Paper>

      {/* Snackbar for copy feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
}

