import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography, Container } from '@mui/material';
import EventRoom from './EventRoom';
//import EventsDetail from './EventsDetail';
import { eventsApi } from '../api/events';

/**
 * EventDetail - 統一的聚會詳情頁面
 * 根據 event.useMeetHalf flag 動態決定顯示：
 * - useMeetHalf = true  → EventsDetail（MeetHalf 計算中點）
 * - useMeetHalf = false → EventRoom（聚會追蹤、即時定位）
 */
export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMeetHalf, setUseMeetHalf] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setError('找不到聚會 ID');
      setLoading(false);
      return;
    }

    // 呼叫真實 API
    const fetchEvent = async () => {
      try {
        const response = await eventsApi.getEvent(parseInt(id));
        
        if (!response || !response.event) {
          setError('找不到此聚會');
          setLoading(false);
          return;
        }
        
        setUseMeetHalf(response.event.useMeetHalf);
        setLoading(false);
      } catch (err: any) {
        console.error('載入聚會失敗:', err);
        setError(err.response?.data?.message || '載入聚會失敗');
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Loading 狀態
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error 狀態
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography
          variant="body2"
          sx={{ cursor: 'pointer', color: 'primary.main' }}
          onClick={() => navigate('/events')}
        >
          ← 返回聚會列表
        </Typography>
      </Container>
    );
  }

  // 根據 useMeetHalf flag 決定顯示哪個組件
  //return useMeetHalf ? <EventsDetail /> : <EventRoom />;
  return <EventRoom />; // 暫時先顯示 EventRoom
}

