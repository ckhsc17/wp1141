import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  TouchApp as PokeIcon,
} from '@mui/icons-material';
import { eventsApi } from '../api/events';
import type { EventResult, MemberStatus } from '../types/events';

interface EventResultPopupProps {
  open: boolean;
  onClose: () => void;
  eventId: number;
}

const getStatusColor = (status: MemberStatus): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'early':
    case 'ontime':
      return 'success';
    case 'late':
      return 'warning';
    case 'absent':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: MemberStatus): string => {
  switch (status) {
    case 'early':
      return '提早到達';
    case 'ontime':
      return '準時到達';
    case 'late':
      return '遲到';
    case 'absent':
      return '缺席';
    default:
      return '未知';
  }
};

const formatDateTime = (timeString?: string): string => {
  if (!timeString) return '--';
  const date = new Date(timeString);
  return date.toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRankBadgeColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return '#E0E0E0';
  }
};

export default function EventResultPopup({ open, onClose, eventId }: EventResultPopupProps) {
  const [result, setResult] = useState<EventResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open && eventId) {
      loadResult();
    }
  }, [open, eventId]);

  const loadResult = async () => {
    setLoading(true);
    setError(null);
    try {
      // 測試用：取消註解下面這段來使用 mock data
      // const USE_MOCK_DATA = true;
      // if (USE_MOCK_DATA) {
      //   await new Promise((resolve) => setTimeout(resolve, 500)); // 模擬 API 延遲
      //   setResult(mockEventResult); // 完整版：包含前三名、遲到、缺席
      //   // setResult(mockEventResultSimple); // 簡化版：只有前三名
      //   // setResult(mockEventResultAllAbsent); // 只有缺席
      //   // setResult(mockEventResultAllLate); // 只有遲到
      //   setLoading(false);
      //   return;
      // }

      // 真實 API 調用
      const response = await eventsApi.getEventResult(eventId);
      setResult(response.result);
    } catch (err: any) {
      console.error('Failed to load event result:', err);
      setError(err.response?.data?.message || '載入排行榜失敗');
    } finally {
      setLoading(false);
    }
  };

  if (!result && !loading && !error) {
    return null;
  }

  const topThree = result?.rankings.filter((r) => r.rank && r.rank <= 3 && r.status !== 'absent') || [];
  const late = result?.rankings.filter((r) => r.status === 'late') || [];
  const absent = result?.rankings.filter((r) => r.status === 'absent') || [];

  // Calculate on-time rate
  const onTimeRate =
    result && result.stats.totalMembers > 0
      ? Math.round(
          ((result.stats.totalMembers - result.stats.lateCount - result.stats.absentCount) /
            result.stats.totalMembers) *
            100
        )
      : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={false}
      maxWidth={false}
      fullWidth={false}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
      PaperProps={{
        sx: {
          width: isMobile ? '90vw' : '600px',
          maxWidth: isMobile ? '90vw' : '90vw',
          height: isMobile ? '80vh' : 'auto',
          minHeight: isMobile ? '400px' : '500px',
          maxHeight: isMobile ? '80vh' : '85vh',
          borderRadius: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2.5,
          px: isMobile ? 2.5 : 3,
          flexShrink: 0,
          borderRadius: '2rem 2rem 0 0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 3,
              bgcolor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrophyIcon sx={{ fontSize: 24, color: '#f59e0b' }} />
          </Box>
          <Typography
            sx={{
              fontWeight: 900,
              color: '#0f172a',
              fontSize: '1.25rem',
            }}
          >
            聚會排行榜
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: isMobile ? 2.5 : 3,
          py: 3,
          bgcolor: '#f8fafc',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box>
            {/* 1. Stats Summary - Glassmorphism style */}
            <Box
              sx={{
                p: 3,
                mb: 3,
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                borderRadius: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  color: '#0f172a',
                  fontSize: '1rem',
                  mb: 2.5,
                  textAlign: 'center',
                }}
              >
                統計數據
              </Typography>

              {/* 三個主指標卡片 */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 2.5,
                    px: 1,
                    borderRadius: '1.5rem',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(241, 245, 249, 0.8)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    minHeight: 80,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      mb: 1,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    人數
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      lineHeight: 1.2,
                    }}
                  >
                    {result.stats.totalMembers}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 2.5,
                    px: 1,
                    borderRadius: '1.5rem',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(241, 245, 249, 0.8)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    minHeight: 80,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      mb: 1,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    已到達
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: '#22c55e',
                      lineHeight: 1.2,
                    }}
                  >
                    {result.stats.arrivedCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 2.5,
                    px: 1,
                    borderRadius: '1.5rem',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(241, 245, 249, 0.8)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    minHeight: 80,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      mb: 1,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    準時率
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: '#2563eb',
                      lineHeight: 1.2,
                    }}
                  >
                    {onTimeRate}%
                  </Typography>
                </Box>
              </Box>

              {/* 次指標：單行灰色文字 */}
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  display: 'block',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              >
                遲到 {result.stats.lateCount} 人 · 缺席 {result.stats.absentCount} 人 · 總戳數{' '}
                {result.stats.totalPokes !== undefined ? result.stats.totalPokes : 0}
              </Typography>
            </Box>

            {/* 2. Top 3 Ranking - Main hero */}
            {topThree.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrophyIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: '#0f172a',
                      fontSize: '1.125rem',
                    }}
                  >
                    前三名
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {topThree.map((item, index) => {
                    const statusColor = getStatusColor(item.status);
                    const statusLabel = getStatusLabel(item.status);
                    const rankBadgeColor = getRankBadgeColor(item.rank || 0);
                    const lateText =
                      item.lateMinutes !== undefined && item.lateMinutes > 0
                        ? `遲到 ${item.lateMinutes} 分鐘`
                        : statusLabel;

                    return (
                      <Fade in timeout={300 + index * 100} key={item.memberId}>
                        <Box
                          sx={{
                            p: 2.5,
                            borderRadius: '2rem',
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2.5,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                            },
                          }}
                        >
                          {/* Left: Rank badge with avatar */}
                          <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar
                              src={item.avatar || undefined}
                              sx={{
                                width: 56,
                                height: 56,
                                bgcolor: '#dbeafe',
                                color: '#2563eb',
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                borderRadius: 3,
                                border: `3px solid ${rankBadgeColor}`,
                                boxShadow: `0 4px 12px ${rankBadgeColor}40`,
                              }}
                            >
                              {item.nickname?.charAt(0) || '?'}
                            </Avatar>
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: rankBadgeColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 900,
                                fontSize: '0.875rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                border: '2px solid white',
                              }}
                            >
                              {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                            </Box>
                          </Box>

                          {/* Center: Name, status, timestamp */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontWeight: 900,
                                color: '#0f172a',
                                fontSize: '1rem',
                                mb: 0.75,
                              }}
                            >
                              {item.nickname || '未命名'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Chip
                                label={lateText}
                                color={statusColor}
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: 2,
                                }}
                              />
                            </Box>
                            {item.arrivalTime && (
                              <Typography
                                sx={{
                                  fontSize: '0.75rem',
                                  color: '#94a3b8',
                                  fontWeight: 500,
                                  mt: 0.5,
                                }}
                              >
                                {formatDateTime(item.arrivalTime)}
                              </Typography>
                            )}
                          </Box>

                          {/* Right: Check icon */}
                          {item.status !== 'absent' && (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: '#dcfce7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <CheckCircleIcon
                                sx={{
                                  color: '#22c55e',
                                  fontSize: 24,
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Fade>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* 3. Late section - Improved design */}
            {late.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ScheduleIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: '#0f172a',
                      fontSize: '1.125rem',
                    }}
                  >
                    遲到 ({late.length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {late.map((item) => (
                    <Box
                      key={item.memberId}
                      sx={{
                        p: 2,
                        borderRadius: '1.5rem',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(254, 243, 199, 0.5)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Avatar
                        src={item.avatar || undefined}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: '#fef3c7',
                          color: '#f59e0b',
                          fontSize: '1rem',
                          fontWeight: 700,
                          borderRadius: 3,
                        }}
                      >
                        {item.nickname?.charAt(0) || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '0.875rem',
                            mb: 0.5,
                          }}
                        >
                          {item.nickname || '未命名'}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            fontWeight: 500,
                          }}
                        >
                          {item.lateMinutes !== undefined && item.lateMinutes > 0
                            ? `遲到 ${item.lateMinutes} 分鐘`
                            : '遲到'}
                        </Typography>
                      </Box>
                      {item.pokeCount > 0 && (
                        <Chip
                          icon={<PokeIcon sx={{ fontSize: 14 }} />}
                          label={item.pokeCount}
                          size="small"
                          sx={{
                            height: 28,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: '#fef3c7',
                            color: '#f59e0b',
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* 4. Absent section - Improved design */}
            {absent.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CancelIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: '#0f172a',
                      fontSize: '1.125rem',
                    }}
                  >
                    缺席 ({absent.length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {absent.map((item) => (
                    <Box
                      key={item.memberId}
                      sx={{
                        p: 2,
                        borderRadius: '1.5rem',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(254, 226, 226, 0.5)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: '#fee2e2',
                          color: '#ef4444',
                          fontSize: '1rem',
                          fontWeight: 700,
                          borderRadius: 3,
                        }}
                      >
                        {item.nickname?.charAt(0) || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '0.875rem',
                            mb: 0.5,
                          }}
                        >
                          {item.nickname || '未命名'}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            fontWeight: 500,
                          }}
                        >
                          未到達
                        </Typography>
                      </Box>
                      {item.pokeCount > 0 && (
                        <Chip
                          icon={<PokeIcon sx={{ fontSize: 14 }} />}
                          label={item.pokeCount}
                          size="small"
                          sx={{
                            height: 28,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: '#fee2e2',
                            color: '#ef4444',
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* 5. Poke stats - Improved design */}
            {result.pokes &&
              result.pokes.mostPoked &&
              result.pokes.mostPoker &&
              (result.pokes.mostPoked.count > 0 || result.pokes.mostPoker.count > 0) && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2.5,
                    borderRadius: '1.5rem',
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PokeIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: '#0f172a',
                        fontSize: '1rem',
                      }}
                    >
                      戳人統計
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        最常被戳
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          {result.pokes.mostPoked.nickname}
                        </Typography>
                        <Chip
                          label={result.pokes.mostPoked.count}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: '#dbeafe',
                            color: '#2563eb',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        最愛戳人
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          {result.pokes.mostPoker.nickname}
                        </Typography>
                        <Chip
                          label={result.pokes.mostPoker.count}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: '#dbeafe',
                            color: '#2563eb',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: isMobile ? 2.5 : 3,
          py: 2.5,
          bgcolor: 'white',
          borderTop: '1px solid #f1f5f9',
          borderRadius: '0 0 2rem 2rem',
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            py: 1.5,
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}
