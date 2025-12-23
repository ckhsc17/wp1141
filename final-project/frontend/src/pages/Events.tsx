import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { LogIn, Plus, ChevronRight, Trophy, Clock, MessageCircle, MapPin } from 'lucide-react';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { eventsApi, Event, inviteApi } from '../api/events';
import Countdown from 'react-countdown';

type EventStatus = 'ongoing' | 'upcoming' | 'ended';

const getEventStatus = (event: Event): EventStatus => {
  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const THIRTY_MINUTES = 30 * 60 * 1000; // 30 分鐘的毫秒數

  if (isAfter(now, endTime)) return 'ended';
  
  // 如果已經開始且在結束時間之前，視為 ongoing
  if (!isBefore(now, startTime) && !isAfter(now, endTime)) {
    return 'ongoing';
  }
  
  // 如果距離開始時間 <= 30 分鐘，視為 ongoing（active）
  const timeUntilStart = startTime.getTime() - now.getTime();
  if (isBefore(now, startTime) && timeUntilStart <= THIRTY_MINUTES) {
    return 'ongoing';
  }
  
  // 如果距離開始時間 > 30 分鐘，視為 upcoming
  if (isBefore(now, startTime)) return 'upcoming';
  
  return 'ongoing';
};

export default function Events() {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [resolving, setResolving] = useState(false);

  // Use React Query to fetch events
  const {
    data: events = [],
    isLoading: loading,
    error: queryError,
  } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await eventsApi.getEvents();
      return response.events;
    },
    staleTime: 30 * 1000, // 30 seconds - events don't change too frequently
  });

  const error = queryError instanceof Error ? queryError.message : (queryError ? 'Failed to load events' : null);

  const { activeEvents, upcomingEvents, pastEvents } = useMemo(() => {
    const active: Event[] = [];
    const upcoming: Event[] = [];
    const past: Event[] = [];

    events.forEach((event) => {
      const status = getEventStatus(event);
      if (status === 'ended') {
        past.push(event);
      } else if (status === 'upcoming') {
        upcoming.push(event);
      } else {
        active.push(event); // ongoing
      }
    });

    active.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    past.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

    return { activeEvents: active, upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  const handleJoinWithToken = async () => {
    if (!inviteToken.trim()) return;

    try {
      setResolving(true);
      const response = await inviteApi.resolveInviteToken(inviteToken.trim());
      setInviteDialogOpen(false);
      setInviteToken('');
      navigate(`/events/${response.eventId}`);
    } catch (err) {
      setSnackbarMessage('無效的邀請碼，請確認後重試');
      setSnackbarOpen(true);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 200px)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 140px)', pb: 12 }}>
      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 4 }}>
            {error}
          </Alert>
        )}

        {/* Active Events Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>Active</Typography>
            
            {/* 快速操作按鈕 */}
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              {/* 建立新聚會按鈕 */}
              <Box
                onClick={() => navigate('/events/new')}
                sx={{
                  bgcolor: '#2563eb',
                  color: 'white',
                  px: { xs: 1.5, sm: 2 },
                  py: 1,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px -2px rgba(37, 99, 235, 0.3)',
                  '&:active': { transform: 'scale(0.95)' },
                  '&:hover': {
                    boxShadow: '0 6px 16px -2px rgba(37, 99, 235, 0.4)',
                    bgcolor: '#1d4ed8',
                  },
                }}
              >
                <Plus size={18} />
                <Typography 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                    color: 'white',
                    whiteSpace: 'nowrap',
                  }}
                >
                  建立新聚會
                </Typography>
              </Box>

              {/* 輸入邀請碼按鈕 */}
              <Box
                onClick={() => setInviteDialogOpen(true)}
                sx={{
                  bgcolor: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  px: { xs: 1.5, sm: 2 },
                  py: 1,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  '&:active': { transform: 'scale(0.95)' },
                  '&:hover': {
                    borderColor: '#2563eb',
                    bgcolor: '#f8fafc',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <LogIn size={18} />
                <Typography 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  輸入邀請碼
                </Typography>
              </Box>
            </Box>
          </Box>

          {activeEvents.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activeEvents.map((event) => {
                const status = getEventStatus(event);
                const memberCount = event._count?.members || event.members?.length || 0;
                const startTime = new Date(event.startTime);
                const now = new Date();
                const isLive = !isBefore(now, startTime); // 活動已經真正開始

                return (
                  <Box
                    key={event.id}
                    sx={{
                      bgcolor: 'white',
                      p: 2.5,
                      borderRadius: '2rem',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:active': { transform: 'scale(0.98)' },
                      '&:hover': {
                        '& .event-title': { color: '#2563eb' },
                      },
                    }}
                  >
                    <Box
                      onClick={() => handleEventClick(event.id)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: status === 'ongoing' ? '#fee2e2' : '#dbeafe',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        {status === 'ongoing' ? '🔴' : '📍'}
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            className="event-title"
                            sx={{
                              fontWeight: 700,
                              color: '#0f172a',
                              transition: 'color 0.2s ease',
                            }}
                          >
                            {event.name}
                          </Typography>
                          {isLive && (
                            <Box
                              sx={{
                                bgcolor: '#dcfce7',
                                color: '#15803d',
                                fontSize: '0.625rem',
                                fontWeight: 900,
                                px: 1,
                                py: 0.25,
                                borderRadius: 10,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Live
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8', flexWrap: 'wrap' }}>
                          <Clock size={12} />
                          {status === 'ongoing' && !isLive ? (
                            // 活動開始前 30 分鐘內，顯示倒數計時
                            <Countdown
                              date={startTime}
                              renderer={({ total, completed }) => {
                                const totalMinutes = Math.ceil(total / (1000 * 60));
                                
                                // 如果已經開始，顯示時間
                                if (completed || totalMinutes > 30) {
                                  return (
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                      {isToday(startTime)
                                        ? format(startTime, 'h:mm a', { locale: zhTW })
                                        : `${format(startTime, 'MM/dd', { locale: zhTW })} ${format(startTime, 'h:mm a', { locale: zhTW })}`}
                                    </Typography>
                                  );
                                }
                                
                                // 如果少於 1 分鐘，顯示「即將開始」
                                if (totalMinutes < 1) {
                                  return (
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                                      即將開始
                                    </Typography>
                                  );
                                }
                                
                                // 顯示倒數計時
                                return (
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                                    還有 {totalMinutes} 分鐘
                                  </Typography>
                                );
                              }}
                            />
                          ) : isToday(startTime) ? (
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                              {format(startTime, 'h:mm a', { locale: zhTW })}
                            </Typography>
                          ) : (
                            <>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                {format(startTime, 'MM/dd', { locale: zhTW })}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                {format(startTime, 'h:mm a', { locale: zhTW })}
                              </Typography>
                            </>
                          )}
                          <Typography sx={{ fontSize: '0.75rem' }}>•</Typography>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {memberCount} friends
                          </Typography>
                        </Box>
                        {(event.meetingPointName || event.meetingPointAddress) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8', mt: 0.5 }}>
                            <MapPin size={12} />
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                              }}
                            >
                              {event.meetingPointName || event.meetingPointAddress}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {event.groupId && (
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat/group/${event.groupId}`);
                          }}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563eb',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#dbeafe',
                            },
                            '&:active': {
                              transform: 'scale(0.9)',
                            },
                          }}
                        >
                          <MessageCircle size={18} />
                        </Box>
                      )}
                      <ChevronRight size={18} style={{ color: '#cbd5e1' }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: 'white',
                p: 4,
                borderRadius: '2rem',
                border: '1px solid #f1f5f9',
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '1rem', mb: 1 }}>
                No active gatherings
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                Tap "New Meet" to create one
              </Typography>
            </Box>
          )}
        </Box>

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>Upcoming</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {upcomingEvents.map((event) => {
                const memberCount = event._count?.members || event.members?.length || 0;
                const startTime = new Date(event.startTime);

                return (
                  <Box
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    sx={{
                      bgcolor: 'white',
                      p: 2.5,
                      borderRadius: '2rem',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:active': { transform: 'scale(0.98)' },
                      '&:hover': {
                        '& .event-title': { color: '#2563eb' },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: '#dbeafe',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        📍
                      </Box>
                      <Box>
                        <Typography
                          className="event-title"
                          sx={{
                            fontWeight: 700,
                            color: '#0f172a',
                            transition: 'color 0.2s ease',
                            mb: 0.5,
                          }}
                        >
                          {event.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8', flexWrap: 'wrap' }}>
                          <Clock size={12} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {format(startTime, 'MM/dd', { locale: zhTW })}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {format(startTime, 'h:mm a', { locale: zhTW })}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem' }}>•</Typography>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {memberCount} friends
                          </Typography>
                        </Box>
                        {(event.meetingPointName || event.meetingPointAddress) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8', mt: 0.5 }}>
                            <MapPin size={12} />
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                              }}
                            >
                              {event.meetingPointName || event.meetingPointAddress}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <ChevronRight size={18} style={{ color: '#cbd5e1' }} />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>History</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {pastEvents.slice(0, 5).map((event) => {
                const startTime = new Date(event.startTime);

                return (
                  <Box
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    sx={{
                      bgcolor: 'rgba(241, 245, 249, 0.5)',
                      p: 2,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: 0.8,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s ease',
                      '&:hover': { opacity: 1 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontSize: '1.25rem', filter: 'grayscale(100%)' }}>🕒</Typography>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569' }}>
                          {event.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.625rem',
                            color: '#94a3b8',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                          }}
                        >
                          {format(startTime, 'MMM d', { locale: zhTW })}
                        </Typography>
                      </Box>
                    </Box>
                    <Trophy size={14} style={{ color: '#cbd5e1' }} />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      {/* Invite Token Input Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#0f172a' }}>輸入邀請碼</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            請輸入您收到的邀請碼來加入活動
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="邀請碼"
            placeholder="例如：abc123xyz..."
            fullWidth
            variant="outlined"
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && inviteToken.trim()) {
                handleJoinWithToken();
              }
            }}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInviteDialogOpen(false)} sx={{ fontWeight: 700 }}>
            取消
          </Button>
          <Button
            onClick={handleJoinWithToken}
            variant="contained"
            disabled={!inviteToken.trim() || resolving}
            startIcon={resolving ? <CircularProgress size={20} /> : <LogIn size={18} />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              bgcolor: '#0f172a',
              '&:hover': { bgcolor: '#1e293b' },
            }}
          >
            {resolving ? '驗證中...' : '加入活動'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
