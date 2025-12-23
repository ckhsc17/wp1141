import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Divider,
  TextField,
  Button,
  Snackbar,
  Alert,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  Settings,
  ChevronRight,
  Lock,
  Info,
  LogOut,
  MapPin,
  Car,
  Bus,
  PersonStanding,
  Bike,
  Motorcycle,
  Edit,
  X,
  Trophy,
  Zap,
  Target,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  Bell,
  BellOff,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';
import { UserStats } from '../types/events';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import {
  stopBeamsClient,
  clearAllInterests,
  subscribeToInterest,
  initializeBeamsClient,
  getSubscribedInterests,
} from '../lib/pusherBeams';

const travelModeOptions = [
  { value: 'driving', label: '開車', icon: Car, color: '#2563eb' },
  { value: 'transit', label: '大眾運輸', icon: Bus, color: '#10b981' },
  { value: 'walking', label: '步行', icon: PersonStanding, color: '#f59e0b' },
  { value: 'bicycling', label: '騎車', icon: Bike, color: '#8b5cf6' },
  { value: 'motorcycle', label: '機車', icon: Motorcycle, color: '#ef4444' },
];

interface Badge {
  id: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  name: string;
  unlocked: boolean;
  condition?: string;
  progress?: {
    current: number;
    target: number;
    description: string;
  };
}

function calculateBadges(stats: UserStats): Badge[] {
  const badges: Badge[] = [];
  
  // 準時王 (DEV: 強制解鎖以展示效果)
  const ontimeUnlocked = true; // stats.ontimeRate >= 0.9 && stats.totalEvents >= 5;
  badges.push({
    id: 'ontime',
    icon: Trophy,
    iconColor: '#f59e0b',
    name: '準時王',
    unlocked: ontimeUnlocked,
    condition: '準時率 ≥ 90% 且參與 ≥ 5 次活動',
    progress: ontimeUnlocked
      ? undefined
      : {
          current: Math.min(stats.totalEvents, 5),
          target: 5,
          description: `準時率：${Math.round(stats.ontimeRate * 100)}% (需要 ≥ 90%)，活動數：${stats.totalEvents}/5`,
        },
  });
  
  // 閃電俠
  const lightningUnlocked = stats.bestRank === 1 && stats.totalEvents >= 3;
  badges.push({
    id: 'lightning',
    icon: Zap,
    iconColor: '#fbbf24',
    name: '閃電俠',
    unlocked: lightningUnlocked,
    condition: '獲得第 1 名且參與 ≥ 3 次活動',
    progress: lightningUnlocked
      ? undefined
      : {
          current: stats.totalEvents,
          target: 3,
          description: `最佳排名：${stats.bestRank === 0 ? '尚未排名' : `第 ${stats.bestRank} 名`} (需要第 1 名)，活動數：${stats.totalEvents}/3`,
        },
  });
  
  // 精準定位
  const preciseUnlocked = stats.avgLateMinutes <= 5 && stats.totalEvents >= 5;
  badges.push({
    id: 'precise',
    icon: Target,
    iconColor: '#10b981',
    name: '精準定位',
    unlocked: preciseUnlocked,
    condition: '平均遲到 ≤ 5 分鐘且參與 ≥ 5 次活動',
    progress: preciseUnlocked
      ? undefined
      : {
          current: stats.totalEvents,
          target: 5,
          description: `平均遲到：${stats.avgLateMinutes.toFixed(1)} 分鐘 (需要 ≤ 5 分鐘)，活動數：${stats.totalEvents}/5`,
        },
  });
  
  // 社交達人
  const socialCount = stats.totalPokeReceived + stats.totalPokeSent;
  const socialUnlocked = socialCount >= 20;
  badges.push({
    id: 'social',
    icon: Users,
    iconColor: '#8b5cf6',
    name: '社交達人',
    unlocked: socialUnlocked,
    condition: '戳人/被戳總次數 ≥ 20 次',
    progress: socialUnlocked
      ? undefined
      : {
          current: socialCount,
          target: 20,
          description: `戳人/被戳總次數：${socialCount}/20`,
        },
  });
  
  // 常客
  const regularUnlocked = stats.totalEvents >= 10;
  badges.push({
    id: 'regular',
    icon: Calendar,
    iconColor: '#2563eb',
    name: '常客',
    unlocked: regularUnlocked,
    condition: '參與 ≥ 10 次活動',
    progress: regularUnlocked
      ? undefined
      : {
          current: stats.totalEvents,
          target: 10,
          description: `參與活動數：${stats.totalEvents}/10`,
        },
  });
  
  // 完美記錄
  const perfectUnlocked = stats.absentCount === 0 && stats.totalEvents >= 5;
  badges.push({
    id: 'perfect',
    icon: Sparkles,
    iconColor: '#ec4899',
    name: '完美記錄',
    unlocked: perfectUnlocked,
    condition: '無缺席記錄且參與 ≥ 5 次活動',
    progress: perfectUnlocked
      ? undefined
      : {
          current: stats.totalEvents,
          target: 5,
          description: `缺席次數：${stats.absentCount} (需要 0 次)，活動數：${stats.totalEvents}/5`,
        },
  });
  
  return badges;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  // Stats are now fetched via React Query (see below)
  const [defaultLocation, setDefaultLocation] = useState({
    lat: null as number | null,
    lng: null as number | null,
    address: '',
    name: '',
  });
  const [travelMode, setTravelMode] = useState<'driving' | 'transit' | 'walking' | 'bicycling' | 'motorcycle'>('driving');
  const [isEditingDefaults, setIsEditingDefaults] = useState(false);
  const [originalDefaults, setOriginalDefaults] = useState({
    location: { lat: null as number | null, lng: null as number | null, address: '', name: '' },
    travelMode: 'driving' as 'driving' | 'transit' | 'walking' | 'bicycling',
  });
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [privacySettingsOpen, setPrivacySettingsOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [togglingNotification, setTogglingNotification] = useState(false);
  const [defaultShareLocation, setDefaultShareLocation] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Use React Query for stats (with cache)
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<UserStats>({
    queryKey: ['userStats', user?.userId],
    queryFn: async () => {
      const response = await usersApi.getStats();
      return response.stats;
    },
    enabled: !!user?.userId,
    staleTime: 60 * 1000, // 1 minute - stats don't change frequently
  });

  const stats = statsData || null;
  const badges = useMemo(() => (stats ? calculateBadges(stats) : []), [stats]);

  // Check notification status
  useEffect(() => {
    const checkNotificationStatus = async () => {
      // Check browser permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

      // Check if user has any subscribed interests
      try {
        const interests = await getSubscribedInterests();
        setNotificationsEnabled(interests.length > 0);
      } catch (error) {
        console.error('Failed to check notification status:', error);
      }
    };
    checkNotificationStatus();
  }, []);

  // Use React Query for profile (with cache)
  const { data: profileData } = useQuery({
    queryKey: ['userProfile', user?.userId],
    queryFn: async () => {
      const response = await usersApi.getProfile();
      return response.user;
    },
    enabled: !!user?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile doesn't change frequently
    onSuccess: (userData) => {
      if (userData) {
        const location = {
          lat: userData.defaultLat || null,
          lng: userData.defaultLng || null,
          address: userData.defaultAddress || '',
          name: userData.defaultLocationName || '',
        };
        const mode = userData.defaultTravelMode || 'driving';
        setDefaultLocation(location);
        setTravelMode(mode);
        setOriginalDefaults({ location, travelMode: mode });
      }
    },
  });

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsLoaded(true))
      .catch((err) => console.error('Failed to load Google Maps:', err));
  }, []);

  useEffect(() => {
    if (
      mapsLoaded &&
      autocompleteInputRef.current &&
      !autocompleteRef.current &&
      typeof google !== 'undefined' &&
      google.maps &&
      google.maps.places
    ) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'tw' },
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          setDefaultLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || '',
            name: place.name || place.formatted_address || '',
          });
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [mapsLoaded]);

  const handleStartEditDefaults = () => {
    setOriginalDefaults({
      location: { ...defaultLocation },
      travelMode,
    });
    setIsEditingDefaults(true);
  };

  const handleCancelEditDefaults = () => {
    setDefaultLocation(originalDefaults.location);
    setTravelMode(originalDefaults.travelMode);
    setIsEditingDefaults(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSaveDefaultLocation = async () => {
    if (!defaultLocation.lat || !defaultLocation.lng) {
      setSnackbar({ open: true, message: '請選擇一個地點', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      await usersApi.updateProfile({
        defaultLat: defaultLocation.lat,
        defaultLng: defaultLocation.lng,
        defaultAddress: defaultLocation.address,
        defaultLocationName: defaultLocation.name,
        defaultTravelMode: travelMode,
      });
      setOriginalDefaults({
        location: { ...defaultLocation },
        travelMode,
      });
      setIsEditingDefaults(false);
      setSnackbar({ open: true, message: '設定已儲存', severity: 'success' });
    } catch (error) {
      console.error('Failed to save default location:', error);
      setSnackbar({ open: true, message: '儲存失敗', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(user?.name || '');
    setEditAvatar(user?.avatar || '');
    setEditProfileOpen(true);
  };

  const handleCloseEditProfile = () => {
    setEditProfileOpen(false);
    setEditName('');
    setEditAvatar('');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setSnackbar({ open: true, message: '請輸入姓名', severity: 'error' });
      return;
    }

    setSavingProfile(true);
    try {
      await usersApi.updateProfile({
        name: editName.trim(),
        avatar: editAvatar.trim() || null,
      });
      await refreshUser();
      setEditProfileOpen(false);
      setSnackbar({ open: true, message: '個人資料已更新', severity: 'success' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSnackbar({ open: true, message: '更新失敗', severity: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        profile: {
          name: user?.name,
          email: user?.email,
          userId: user?.userId,
        },
        stats: stats,
        badges: badges,
        defaultLocation: defaultLocation,
        defaultTravelMode: travelMode,
        exportedAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meethalf-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: '數據已匯出', severity: 'success' });
    } catch (error) {
      console.error('Failed to export data:', error);
      setSnackbar({ open: true, message: '匯出失敗', severity: 'error' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('確定要刪除帳號嗎？此操作無法復原。')) {
      return;
    }

    try {
      // TODO: 如果後端有 API，調用 DELETE /users/account
      setSnackbar({
        open: true,
        message: '刪除帳號功能尚未實現，請聯繫管理員',
        severity: 'info',
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
      setSnackbar({ open: true, message: '刪除失敗', severity: 'error' });
    }
  };

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setBadgeDialogOpen(true);
  };

  const handleSavePrivacySettings = async () => {
    try {
      // TODO: 如果後端有 API，調用 PATCH /users/privacy
      setPrivacySettingsOpen(false);
      setSnackbar({ open: true, message: '隱私設定已儲存', severity: 'success' });
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      setSnackbar({ open: true, message: '儲存失敗', severity: 'error' });
    }
  };

  const handleToggleNotifications = async () => {
    setTogglingNotification(true);
    try {
      if (notificationsEnabled) {
        // 關閉通知：清除所有訂閱並停止 client
        await clearAllInterests();
        await stopBeamsClient();
        setNotificationsEnabled(false);
        setSnackbar({ open: true, message: '已關閉推播通知', severity: 'success' });
      } else {
        // 開啟通知：重新初始化並訂閱
        if ('Notification' in window && Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          if (permission !== 'granted') {
            setSnackbar({ open: true, message: '需要通知權限才能開啟推播', severity: 'error' });
            return;
          }
        }

        const client = await initializeBeamsClient();
        if (client && user?.userId) {
          const interest = `user-${user.userId}`;
          await subscribeToInterest(interest);
          setNotificationsEnabled(true);
          setSnackbar({ open: true, message: '已開啟推播通知', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: '無法開啟推播通知', severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      setSnackbar({ open: true, message: '操作失敗', severity: 'error' });
    } finally {
      setTogglingNotification(false);
    }
  };

  const settingsItems = [
    {
      icon: notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />,
      label: '通知設定',
      onClick: () => setNotificationSettingsOpen(true),
      rightContent: (
        <Typography sx={{ fontSize: '0.75rem', color: notificationsEnabled ? '#22c55e' : '#94a3b8' }}>
          {notificationsEnabled ? '已開啟' : '已關閉'}
        </Typography>
      ),
    },
    {
      icon: <Lock size={20} />,
      label: '隱私設定',
      onClick: () => setPrivacySettingsOpen(true),
    },
    {
      icon: <Info size={20} />,
      label: '關於 MeetHalf',
      onClick: () => {
        setSnackbar({ open: true, message: 'MeetHalf v1.0.0', severity: 'info' });
      },
    },
  ];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 140px)', pb: 12 }}>
      {/* Header with Avatar */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #f1f5f9', pt: 4, pb: 4, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Box
            onClick={() => navigate('/settings')}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 3,
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
            <Settings size={20} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.avatar || undefined}
              sx={{
                width: 100,
                height: 100,
                bgcolor: '#2563eb',
                fontSize: '2.5rem',
                mb: 2,
                border: '4px solid white',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)',
              }}
            >
              {user?.name?.[0]?.toUpperCase() || '👤'}
            </Avatar>
            <IconButton
              onClick={handleOpenEditProfile}
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 0,
                width: 32,
                height: 32,
                bgcolor: 'white',
                border: '2px solid #f1f5f9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              <Edit size={14} />
            </IconButton>
          </Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
            {user?.name || '訪客用戶'}
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontWeight: 500 }}>
            {user?.email || '未登入'}
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ px: 3, mt: 3 }}>
        {statsLoading ? (
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '2rem',
              p: 3,
              border: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 120,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : statsError ? (
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '2rem',
              p: 3,
              border: '1px solid #f1f5f9',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: '#ef4444', fontSize: '0.875rem' }}>
              {statsError}
            </Typography>
          </Box>
        ) : stats ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '1.5rem',
                border: '1px solid #f1f5f9',
                p: 2.5,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                }}
              >
                <Calendar size={24} color="#2563eb" />
              </Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {stats.totalEvents}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, mt: 0.5 }}>
                活動總數
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '1.5rem',
                border: '1px solid #f1f5f9',
                p: 2.5,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                }}
              >
                <Target size={24} color="#22c55e" />
              </Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {Math.round(stats.ontimeRate * 100)}%
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, mt: 0.5 }}>
                準時率
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '1.5rem',
                border: '1px solid #f1f5f9',
                p: 2.5,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                }}
              >
                <Trophy size={24} color="#f59e0b" />
              </Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {stats.bestRank === 1 ? stats.ontimeCount : 0}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, mt: 0.5 }}>
                冠軍
              </Typography>
            </Box>
          </Box>
        ) : null}
      </Box>

      {/* Badges */}
      <Box sx={{ px: 3, mt: 4 }}>
        <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 2, px: 1 }}>
          Achievements
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <Box
                key={badge.id}
                onClick={() => handleBadgeClick(badge)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                  '&:active': { transform: 'scale(0.95)' },
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: badge.unlocked ? 'white' : '#f8fafc',
                    border: badge.unlocked ? `2px solid ${badge.iconColor}` : '2px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: badge.unlocked
                      ? `0 4px 12px ${badge.iconColor}30`
                      : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {badge.unlocked ? (
                    <Icon size={26} color={badge.iconColor} />
                  ) : (
                    <Icon size={26} color="#cbd5e1" />
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: badge.unlocked ? '#0f172a' : '#94a3b8',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}
                >
                  {badge.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Default Location & Travel Mode */}
      <Box sx={{ px: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
          <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
            預設位置
          </Typography>
          {!isEditingDefaults && (
            <IconButton
              onClick={handleStartEditDefaults}
              sx={{
                width: 32,
                height: 32,
                color: '#64748b',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              <Edit size={18} />
            </IconButton>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '1.5rem',
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
          }}
        >
          {!isEditingDefaults ? (
            // 查看模式
            <>
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <MapPin size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        mb: 0.5,
                        fontWeight: 600,
                      }}
                    >
                      出發點
                    </Typography>
                    {defaultLocation.lat && defaultLocation.lng ? (
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: '#0f172a',
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {defaultLocation.name || defaultLocation.address}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                        未設定
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {(() => {
                    const option = travelModeOptions.find(opt => opt.value === travelMode);
                    const Icon = option?.icon || Car;
                    return (
                      <>
                        <Icon size={18} style={{ color: option?.color || '#2563eb', flexShrink: 0 }} />
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: '#94a3b8',
                              mb: 0.5,
                              fontWeight: 600,
                            }}
                          >
                            交通方式
                          </Typography>
                          <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                            {option?.label || '開車'}
                          </Typography>
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              </Box>
            </>
          ) : (
            // 編輯模式
            <>
              <Box sx={{ p: 3 }}>
                {/* Default Location */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 1.5, fontWeight: 600 }}>
                    出發點
                  </Typography>
                  <TextField
                    inputRef={autocompleteInputRef}
                    fullWidth
                    placeholder="搜尋地點..."
                    value={defaultLocation.name || defaultLocation.address}
                    onChange={(e) =>
                      setDefaultLocation((prev) => ({ ...prev, name: e.target.value }))
                    }
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        '& fieldset': {
                          borderColor: '#e2e8f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#cbd5e1',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563eb',
                        },
                      },
                    }}
                  />
                  {defaultLocation.lat && defaultLocation.lng && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#22c55e', mt: 1, fontWeight: 600 }}>
                      ✓ 已選擇：{defaultLocation.name || defaultLocation.address}
                    </Typography>
                  )}
                </Box>

                {/* Default Travel Mode */}
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 1.5, fontWeight: 600 }}>
                    交通方式
                  </Typography>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={travelMode}
                      onChange={(e) => setTravelMode(e.target.value as any)}
                    >
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                        {travelModeOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <FormControlLabel
                              key={option.value}
                              value={option.value}
                              control={<Radio size="small" />}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Icon size={16} style={{ color: option.color }} />
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                    {option.label}
                                  </Typography>
                                </Box>
                              }
                              sx={{
                                bgcolor: travelMode === option.value ? '#f0f9ff' : 'transparent',
                                border: `1.5px solid ${
                                  travelMode === option.value ? option.color : '#e2e8f0'
                                }`,
                                borderRadius: 2,
                                m: 0,
                                p: 1.25,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#f8fafc',
                                  borderColor: option.color,
                                },
                              }}
                            />
                          );
                        })}
                      </Box>
                    </RadioGroup>
                  </FormControl>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ p: 2.5, display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleCancelEditDefaults}
                  disabled={saving}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                    fontSize: '0.875rem',
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSaveDefaultLocation}
                  disabled={saving || !defaultLocation.lat}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {saving ? '儲存中...' : '儲存'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Account Settings */}
      <Box sx={{ px: 3, mt: 4 }}>
        <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 2, px: 1 }}>
          帳號資訊
        </Typography>
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '1.5rem',
            border: '1px solid #f1f5f9',
            p: 3,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 0.5 }}>
              電子郵件
            </Typography>
            <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
              {user?.email || '未設定'}
            </Typography>
          </Box>
          {user?.userId && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 0.5 }}>
                用戶 ID
              </Typography>
              <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                {user.userId}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Settings */}
      <Box sx={{ px: 3, mt: 4 }}>
        <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 2, px: 1 }}>
          Settings
        </Typography>
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '1.5rem',
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
          }}
        >
          {settingsItems.map((item, index) => (
            <Box
              key={item.label}
              onClick={item.onClick}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: index < settingsItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              <Box sx={{ color: '#64748b' }}>{item.icon}</Box>
              <Typography sx={{ flex: 1, fontWeight: 600, color: '#475569' }}>
                {item.label}
              </Typography>
              {'rightContent' in item && item.rightContent}
              <ChevronRight size={18} style={{ color: '#cbd5e1' }} />
            </Box>
          ))}
          <Box
            onClick={handleExportData}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              borderTop: '1px solid #f1f5f9',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: '#f8fafc' },
            }}
          >
            <Box sx={{ color: '#64748b' }}>
              <ChevronRight size={20} style={{ transform: 'rotate(-90deg)' }} />
            </Box>
            <Typography sx={{ flex: 1, fontWeight: 600, color: '#475569' }}>
              匯出數據
            </Typography>
            <ChevronRight size={18} style={{ color: '#cbd5e1' }} />
          </Box>
        </Box>
      </Box>

      {/* Delete Account & Logout */}
      <Box sx={{ px: 3, mt: 4, mb: 4 }}>
        <Box
          onClick={handleDeleteAccount}
          sx={{
            bgcolor: 'white',
            border: '1px solid #fee2e2',
            borderRadius: '1.5rem',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: '#dc2626',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            mb: 2,
            '&:active': { transform: 'scale(0.98)' },
          }}
        >
          <X size={18} />
          刪除帳號
        </Box>
        <Box
          onClick={handleLogout}
          sx={{
            bgcolor: 'white',
            border: '1px solid #fecaca',
            borderRadius: '1.5rem',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: '#ef4444',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            '&:active': { transform: 'scale(0.98)' },
          }}
        >
          <LogOut size={20} />
          登出帳號
        </Box>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editProfileOpen}
        onClose={handleCloseEditProfile}
        PaperProps={{
          sx: {
            borderRadius: '2rem',
            maxWidth: '90%',
            width: 400,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
          編輯個人資料
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="姓名"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="頭像 URL（選填）"
              value={editAvatar}
              onChange={(e) => setEditAvatar(e.target.value)}
              fullWidth
              size="small"
              placeholder="https://..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={handleCloseEditProfile}
            disabled={savingProfile}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: '#64748b',
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile || !editName.trim()}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {savingProfile ? '儲存中...' : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Badge Detail Dialog */}
      <Dialog
        open={badgeDialogOpen}
        onClose={() => setBadgeDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '2rem',
            maxWidth: '90%',
            width: 400,
          },
        }}
      >
        {selectedBadge && (
          <>
            <DialogTitle sx={{ fontWeight: 900, pb: 1, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                {selectedBadge.unlocked ? (
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: '#f0f9ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {(() => {
                      const Icon = selectedBadge.icon;
                      return <Icon size={32} color={selectedBadge.iconColor} />;
                    })()}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {(() => {
                      const Icon = selectedBadge.icon;
                      return <Icon size={32} color="#cbd5e1" />;
                    })()}
                  </Box>
                )}
              </Box>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 900 }}>
                {selectedBadge.name}
              </Typography>
            </DialogTitle>
            <DialogContent>
              {selectedBadge.unlocked ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <CheckCircle2 size={20} color="#22c55e" />
                    <Typography sx={{ color: '#22c55e', fontWeight: 600 }}>
                      已獲得
                    </Typography>
                  </Box>
                  <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {selectedBadge.condition}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ py: 2 }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 2, textAlign: 'center' }}>
                    {selectedBadge.condition}
                  </Typography>
                  {selectedBadge.progress && (
                    <>
                      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 1, fontWeight: 600 }}>
                        進度
                      </Typography>
                      <Box sx={{ mb: 1.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(selectedBadge.progress.current / selectedBadge.progress.target) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: selectedBadge.iconColor,
                            },
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 2 }}>
                        {selectedBadge.progress.description}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8125rem', color: '#0f172a', fontWeight: 600 }}>
                        {selectedBadge.progress.current} / {selectedBadge.progress.target}
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button
                onClick={() => setBadgeDialogOpen(false)}
                variant="contained"
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                知道了
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog
        open={notificationSettingsOpen}
        onClose={() => setNotificationSettingsOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '2rem',
            maxWidth: '90%',
            width: 400,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
          通知設定
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* 瀏覽器權限狀態 */}
            <Box
              sx={{
                p: 2,
                bgcolor: notificationPermission === 'granted' ? '#f0fdf4' : notificationPermission === 'denied' ? '#fef2f2' : '#f8fafc',
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                {notificationPermission === 'granted' ? (
                  <CheckCircle2 size={18} color="#22c55e" />
                ) : notificationPermission === 'denied' ? (
                  <BellOff size={18} color="#ef4444" />
                ) : (
                  <Bell size={18} color="#94a3b8" />
                )}
                <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                  瀏覽器通知權限
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                {notificationPermission === 'granted'
                  ? '已授權，可以接收推播通知'
                  : notificationPermission === 'denied'
                  ? '已被拒絕，請在瀏覽器設定中開啟'
                  : '尚未授權，點擊下方開關來請求權限'}
              </Typography>
            </Box>

            {/* 推播通知開關 */}
            <Box
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                  推播通知
                </Typography>
                <Button
                  variant={notificationsEnabled ? 'contained' : 'outlined'}
                  size="small"
                  onClick={handleToggleNotifications}
                  disabled={togglingNotification || notificationPermission === 'denied'}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    minWidth: 60,
                  }}
                >
                  {togglingNotification ? '...' : notificationsEnabled ? '開啟' : '關閉'}
                </Button>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                接收活動提醒、戳人通知等即時訊息
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setNotificationSettingsOpen(false)}
            variant="contained"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            完成
          </Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Settings Dialog */}
      <Dialog
        open={privacySettingsOpen}
        onClose={() => setPrivacySettingsOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '2rem',
            maxWidth: '90%',
            width: 400,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
          隱私設定
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                  預設分享位置
                </Typography>
                <Button
                  variant={defaultShareLocation ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setDefaultShareLocation(!defaultShareLocation)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    minWidth: 60,
                  }}
                >
                  {defaultShareLocation ? '開啟' : '關閉'}
                </Button>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                加入活動時預設分享你的位置資訊
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setPrivacySettingsOpen(false)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: '#64748b',
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleSavePrivacySettings}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
