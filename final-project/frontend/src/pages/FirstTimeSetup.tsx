import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { MapPin, Car, Bus, PersonStanding, Bike, Motorcycle, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

const travelModeOptions = [
  { value: 'driving', label: '開車', icon: Car, color: '#2563eb' },
  { value: 'transit', label: '大眾運輸', icon: Bus, color: '#10b981' },
  { value: 'walking', label: '步行', icon: PersonStanding, color: '#f59e0b' },
  { value: 'bicycling', label: '騎車', icon: Bike, color: '#8b5cf6' },
  { value: 'motorcycle', label: '機車', icon: Motorcycle, color: '#ef4444' },
];

export default function FirstTimeSetup() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [userId, setUserId] = useState('');
  const [suggestedUserId, setSuggestedUserId] = useState('');
  const [userIdError, setUserIdError] = useState('');
  const [checkingUserId, setCheckingUserId] = useState(false);
  const [location, setLocation] = useState({
    lat: null as number | null,
    lng: null as number | null,
    address: '',
    name: '',
  });
  const [travelMode, setTravelMode] = useState<'driving' | 'transit' | 'walking' | 'bicycling'>('driving');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Generate suggested userId from email
  useEffect(() => {
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      // Generate random 3-character suffix
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let suffix = '';
      for (let i = 0; i < 3; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const suggested = `${emailPrefix}_${suffix}`;
      setSuggestedUserId(suggested);
      setUserId(suggested);
    }
  }, [user?.email]);

  // Check if user already completed setup
  useEffect(() => {
    if (user && !user.needsSetup) {
      navigate('/events');
    }
  }, [user, navigate]);

  // Load Google Maps
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsLoaded(true))
      .catch((err) => console.error('Failed to load Google Maps:', err));
  }, []);

  // Setup autocomplete
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
          setLocation({
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

  const handleUserIdChange = async (value: string) => {
    setUserId(value);
    setUserIdError('');

    // Basic validation
    if (value.length < 3) {
      setUserIdError('User ID 至少需要 3 個字元');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUserIdError('User ID 只能包含英文、數字和底線');
      return;
    }

    // Check availability
    setCheckingUserId(true);
    try {
      const { available } = await usersApi.checkUserIdAvailable({ userId: value });
      if (!available) {
        setUserIdError('此 User ID 已被使用');
      }
    } catch (err) {
      console.error('Failed to check userId:', err);
    } finally {
      setCheckingUserId(false);
    }
  };

  const handleRegenerateSuggestion = () => {
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let suffix = '';
      for (let i = 0; i < 3; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const suggested = `${emailPrefix}_${suffix}`;
      setSuggestedUserId(suggested);
      setUserId(suggested);
      handleUserIdChange(suggested);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!userId) {
      setError('請輸入 User ID');
      return;
    }
    if (userIdError) {
      setError('請修正 User ID 錯誤');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await usersApi.completeSetup({
        userId,
        defaultLat: location.lat,
        defaultLng: location.lng,
        defaultAddress: location.address,
        defaultLocationName: location.name,
        defaultTravelMode: travelMode,
      });

      // Refresh user data
      await refreshUser();

      // Navigate to events page
      navigate('/events');
    } catch (err: any) {
      console.error('Failed to complete setup:', err);
      if (err.response?.data?.code === 'USERID_TAKEN') {
        setUserIdError('此 User ID 已被使用');
        setError('此 User ID 已被使用，請選擇其他 ID');
      } else {
        setError('設定失敗，請稍後再試');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4, px: 3 }}>
      {/* Header */}
      <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
        <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#0f172a',
            textAlign: 'center',
            mb: 1,
          }}
        >
          歡迎加入 MeetHalf！
        </Typography>
        <Typography sx={{ color: '#64748b', textAlign: 'center', fontWeight: 500 }}>
          請先完成一些基本設定
        </Typography>
      </Box>

      {/* Main Form */}
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* User ID Section */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '1.5rem',
            border: '1px solid #f1f5f9',
            p: 3,
            mb: 3,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
            設定 User ID
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 2 }}>
            這將是你在 MeetHalf 上的唯一識別碼，其他使用者可以用此 ID 加你為好友。
          </Typography>
          <TextField
            fullWidth
            value={userId}
            onChange={(e) => handleUserIdChange(e.target.value)}
            placeholder="例如：john_abc"
            error={!!userIdError}
            helperText={userIdError || '可使用英文、數字和底線，至少 3 個字元'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {checkingUserId ? (
                    <CircularProgress size={20} />
                  ) : (
                    <IconButton onClick={handleRegenerateSuggestion} size="small">
                      <RefreshCw size={20} />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />
        </Box>

        {/* Default Location Section */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '1.5rem',
            border: '1px solid #f1f5f9',
            p: 3,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <MapPin size={20} style={{ color: '#2563eb' }} />
            <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
              預設出發點（選填）
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 2 }}>
            設定你的常用出發地點，系統將用此位置預估你到達集合點的交通時間。
          </Typography>
          <TextField
            inputRef={autocompleteInputRef}
            fullWidth
            placeholder="搜尋地點..."
            value={location.name || location.address}
            onChange={(e) =>
              setLocation((prev) => ({ ...prev, name: e.target.value }))
            }
            size="small"
          />
          {location.lat && location.lng && (
            <Typography sx={{ fontSize: '0.75rem', color: '#22c55e', mt: 1, fontWeight: 600 }}>
              ✓ 已選擇：{location.name || location.address}
            </Typography>
          )}
        </Box>

        {/* Default Travel Mode Section */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '1.5rem',
            border: '1px solid #f1f5f9',
            p: 3,
            mb: 3,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
            預設交通方式（選填）
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 3 }}>
            選擇你最常使用的交通方式，系統將依此計算預估到達時間。
          </Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value as any)}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {travelModeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon size={18} style={{ color: option.color }} />
                          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {option.label}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        bgcolor: travelMode === option.value ? '#f0f9ff' : 'transparent',
                        border: `2px solid ${
                          travelMode === option.value ? option.color : '#e2e8f0'
                        }`,
                        borderRadius: 2,
                        m: 0,
                        p: 1.5,
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

        {/* Submit Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={submitting || checkingUserId || !!userIdError || !userId}
          sx={{
            borderRadius: '1rem',
            py: 1.5,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            bgcolor: '#2563eb',
            '&:hover': {
              bgcolor: '#1d4ed8',
            },
            '&:disabled': {
              bgcolor: '#cbd5e1',
            },
          }}
        >
          {submitting ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            '完成設定並進入 MeetHalf'
          )}
        </Button>

        <Typography sx={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', mt: 2 }}>
          你可以稍後在個人資料中修改這些設定
        </Typography>
      </Box>
    </Box>
  );
}

