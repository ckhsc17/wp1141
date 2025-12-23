import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Button,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft, Trash2, Calendar, Zap } from 'lucide-react';
import { UserPlus, Megaphone, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useFriends } from '../hooks/useFriends';
import { Notification } from '../types/notification';
import { eventInvitationsApi } from '../api/eventInvitations';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'event_invite':
    case 'EVENT_INVITE':
    case 'EVENT_UPDATE':
      return <Calendar size={18} />;
    case 'event_update':
      return <Megaphone size={18} />;
    case 'friend_request':
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
      return <UserPlus size={18} />;
    case 'poke':
    case 'POKE':
      return <Zap size={18} />;
    default:
      return <Calendar size={18} />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'event_invite':
    case 'EVENT_INVITE':
      return { bg: '#dbeafe', color: '#2563eb' };
    case 'event_update':
    case 'EVENT_UPDATE':
      return { bg: '#fef3c7', color: '#d97706' };
    case 'friend_request':
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
      return { bg: '#dcfce7', color: '#16a34a' };
    case 'poke':
    case 'POKE':
      return { bg: '#fee2e2', color: '#dc2626' };
    default:
      return { bg: '#f1f5f9', color: '#64748b' };
  }
};


const formatTimestamp = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhTW,
    });
  } catch {
    return '';
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, loading, loadNotifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } =
    useNotifications(user?.userId || undefined);
  const { acceptRequest, rejectRequest } = useFriends();
  
  // Track processed invitations (accepted/rejected)
  const [processedInvitations, setProcessedInvitations] = useState<{
    [notificationId: number]: 'accepted' | 'rejected'
  }>({});

  // Track loading states for accept/reject actions
  const [loadingActions, setLoadingActions] = useState<{
    [notificationId: number]: 'accept' | 'reject' | null
  }>({});

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'FRIEND_ACCEPTED':
        navigate('/friends');
        break;
      case 'NEW_MESSAGE':
        if (notification.data?.groupId) {
          navigate(`/chat/group/${notification.data.groupId}`);
        } else if (notification.data?.senderId) {
          navigate(`/chat/user/${notification.data.senderId}`);
        }
        break;
      case 'EVENT_INVITE':
      case 'EVENT_UPDATE':
      case 'POKE':
        if (notification.data?.eventId) {
          navigate(`/events/${notification.data.eventId}`);
        }
        break;
      default:
        break;
    }
  };

  const handleAcceptFriendRequest = async (notification: Notification) => {
    if (notification.data?.requestId) {
      setLoadingActions(prev => ({...prev, [notification.id]: 'accept'}));
      try {
        await acceptRequest(notification.data.requestId);
        setProcessedInvitations(prev => ({...prev, [notification.id]: 'accepted'}));
        loadNotifications();
      } catch (error) {
        console.error('Failed to accept friend request:', error);
      } finally {
        setLoadingActions(prev => ({...prev, [notification.id]: null}));
      }
    }
  };

  const handleRejectFriendRequest = async (notification: Notification) => {
    if (notification.data?.requestId) {
      setLoadingActions(prev => ({...prev, [notification.id]: 'reject'}));
      try {
        await rejectRequest(notification.data.requestId);
        setProcessedInvitations(prev => ({...prev, [notification.id]: 'rejected'}));
        loadNotifications();
      } catch (error) {
        console.error('Failed to reject friend request:', error);
      } finally {
        setLoadingActions(prev => ({...prev, [notification.id]: null}));
      }
    }
  };

  const handleAcceptEventInvite = async (notification: Notification) => {
    if (notification.data?.eventId && notification.data?.invitationId) {
      setLoadingActions(prev => ({...prev, [notification.id]: 'accept'}));
      try {
        await eventInvitationsApi.acceptInvitation(
          notification.data.eventId,
          notification.data.invitationId
        );
        setProcessedInvitations(prev => ({...prev, [notification.id]: 'accepted'}));
        loadNotifications();
        navigate(`/events/${notification.data.eventId}`);
      } catch (error) {
        console.error('Failed to accept event invitation:', error);
      } finally {
        setLoadingActions(prev => ({...prev, [notification.id]: null}));
      }
    }
  };

  const handleRejectEventInvite = async (notification: Notification) => {
    if (notification.data?.eventId && notification.data?.invitationId) {
      setLoadingActions(prev => ({...prev, [notification.id]: 'reject'}));
      try {
        await eventInvitationsApi.rejectInvitation(
          notification.data.eventId,
          notification.data.invitationId
        );
        setProcessedInvitations(prev => ({...prev, [notification.id]: 'rejected'}));
        loadNotifications();
      } catch (error) {
        console.error('Failed to reject event invitation:', error);
      } finally {
        setLoadingActions(prev => ({...prev, [notification.id]: null}));
      }
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 140px)', pb: 12 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #f1f5f9',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          onClick={() => navigate(-1)}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 4,
            bgcolor: '#f8fafc',
            border: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            '&:active': { transform: 'scale(0.9)' },
          }}
        >
          <ArrowLeft size={20} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 900, color: '#0f172a', fontSize: '1.25rem' }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
              {unreadCount} unread
            </Typography>
          )}
        </Box>
        {unreadCount > 0 && (
          <Typography
            onClick={() => markAllAsRead()}
            sx={{
              color: '#2563eb',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              '&:active': { transform: 'scale(0.95)' },
            }}
          >
            Mark all read
          </Typography>
        )}
      </Box>

      {/* Notifications List */}
      <Box sx={{ p: 2 }}>
        {notifications.filter(n => n.type !== 'NEW_MESSAGE').length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {notifications.filter(n => n.type !== 'NEW_MESSAGE').map((notification) => {
              const colors = getNotificationColor(notification.type);
              const isFriendRequest = notification.type === 'FRIEND_REQUEST';
              const isEventInvite = notification.type === 'EVENT_INVITE';
              
              // Check current status from backend
              const friendRequestStatus = notification.data?.requestStatus;
              const eventInvitationStatus = notification.data?.invitationStatus;
              
              // Check if already processed (from state or from backend status)
              const isAlreadyAccepted = 
                processedInvitations[notification.id] === 'accepted' ||
                friendRequestStatus === 'accepted' ||
                eventInvitationStatus === 'accepted';
              
              const isAlreadyRejected = 
                processedInvitations[notification.id] === 'rejected' ||
                friendRequestStatus === 'rejected' ||
                eventInvitationStatus === 'rejected';
              
              const hasActions = (isFriendRequest || isEventInvite) && !isAlreadyAccepted && !isAlreadyRejected;
              
              return (
                <Box
                  key={notification.id}
                  onClick={() => !hasActions && handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'white' : 'rgba(37, 99, 235, 0.03)',
                    p: 2,
                    borderRadius: '1.5rem',
                    border: `1px solid ${notification.read ? '#f1f5f9' : 'rgba(37, 99, 235, 0.1)'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    cursor: hasActions ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    '&:active': { transform: 'scale(0.99)' },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: colors.bg,
                      color: colors.color,
                      borderRadius: 3,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#2563eb',
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      sx={{
                        color: '#64748b',
                        fontSize: '0.8rem',
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {notification.body}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.625rem', fontWeight: 600 }}>
                      {formatTimestamp(notification.createdAt)}
                    </Typography>

                    {/* Friend Request Actions */}
                    {isFriendRequest && (
                      <Box sx={{ mt: 1.5 }}>
                        {isAlreadyAccepted ? (
                          <Typography
                            sx={{
                              color: '#16a34a',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }}
                          >
                            您與 {notification.data?.fromUserName || '對方'} 已成為好友
                          </Typography>
                        ) : isAlreadyRejected ? (
                          <Typography
                            sx={{
                              color: '#64748b',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              fontStyle: 'italic',
                            }}
                          >
                            已拒絕此好友邀請
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={
                                loadingActions[notification.id] === 'accept' ? (
                                  <CircularProgress size={14} sx={{ color: 'white' }} />
                                ) : (
                                  <Check size={16} />
                                )
                              }
                              onClick={() => handleAcceptFriendRequest(notification)}
                              disabled={loadingActions[notification.id] === 'accept' || loadingActions[notification.id] === 'reject'}
                              sx={{
                                borderRadius: 3,
                                bgcolor: '#22c55e',
                                '&:hover': { bgcolor: '#16a34a' },
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:disabled': {
                                  bgcolor: '#94a3b8',
                                  color: 'white',
                                },
                              }}
                            >
                              接受
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={
                                loadingActions[notification.id] === 'reject' ? (
                                  <CircularProgress size={14} />
                                ) : (
                                  <X size={16} />
                                )
                              }
                              onClick={() => handleRejectFriendRequest(notification)}
                              disabled={loadingActions[notification.id] === 'accept' || loadingActions[notification.id] === 'reject'}
                              sx={{
                                borderRadius: 3,
                                borderColor: '#e2e8f0',
                                color: '#64748b',
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:disabled': {
                                  borderColor: '#cbd5e1',
                                  color: '#94a3b8',
                                },
                              }}
                            >
                              拒絕
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Event Invite Actions */}
                    {isEventInvite && (
                      <Box sx={{ mt: 1.5 }}>
                        {isAlreadyAccepted ? (
                          <Typography
                            sx={{
                              color: '#2563eb',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }}
                          >
                            您已加入此活動
                          </Typography>
                        ) : isAlreadyRejected ? (
                          <Typography
                            sx={{
                              color: '#64748b',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }}
                          >
                            已拒絕此活動邀請
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={
                                loadingActions[notification.id] === 'accept' ? (
                                  <CircularProgress size={14} sx={{ color: 'white' }} />
                                ) : (
                                  <Check size={16} />
                                )
                              }
                              onClick={() => handleAcceptEventInvite(notification)}
                              disabled={loadingActions[notification.id] === 'accept' || loadingActions[notification.id] === 'reject'}
                              sx={{
                                borderRadius: 3,
                                bgcolor: '#2563eb',
                                '&:hover': { bgcolor: '#1d4ed8' },
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:disabled': {
                                  bgcolor: '#94a3b8',
                                  color: 'white',
                                },
                              }}
                            >
                              接受並加入
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={
                                loadingActions[notification.id] === 'reject' ? (
                                  <CircularProgress size={14} />
                                ) : (
                                  <X size={16} />
                                )
                              }
                              onClick={() => handleRejectEventInvite(notification)}
                              disabled={loadingActions[notification.id] === 'accept' || loadingActions[notification.id] === 'reject'}
                              sx={{
                                borderRadius: 3,
                                borderColor: '#e2e8f0',
                                color: '#64748b',
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:disabled': {
                                  borderColor: '#cbd5e1',
                                  color: '#94a3b8',
                                },
                              }}
                            >
                              拒絕
                            </Button>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => handleNotificationClick(notification)}
                              disabled={loadingActions[notification.id] === 'accept' || loadingActions[notification.id] === 'reject'}
                              sx={{
                                borderRadius: 3,
                                color: '#2563eb',
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:disabled': {
                                  color: '#94a3b8',
                                },
                              }}
                            >
                              查看詳情
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' },
                      '&:active': { transform: 'scale(0.9)' },
                    }}
                  >
                    <Trash2 size={16} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>🔔</Typography>
            <Typography sx={{ fontWeight: 700, color: '#64748b' }}>沒有通知</Typography>
            <Typography sx={{ color: '#94a3b8', mt: 1 }}>
              所有通知都會顯示在這裡
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
