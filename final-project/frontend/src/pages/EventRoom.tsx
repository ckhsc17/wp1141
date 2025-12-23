import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Chip,
  Paper,
  IconButton,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  TouchApp as PokeIcon,
  EmojiEvents as TrophyIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import Countdown from 'react-countdown';
import { eventsApi, type Event as ApiEvent, type Member, type TravelMode, type MemberETA, type ETAUpdateEvent } from '../api/events';
import { useEventProgress } from '../hooks/useEventProgress';
import { usePusher } from '../hooks/usePusher';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { showPokeNotification } from '../lib/notifications';
import { subscribeToInterest, unsubscribeFromInterest } from '../lib/pusherBeams';
import type { PokeEvent, EventEndedEvent, MemberArrivedEvent, MemberJoinedEvent, LocationUpdateEvent } from '../types/events';
import MapContainer from '../components/MapContainer';
import EventResultPopup from '../components/EventResultPopup';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { MessageCircle, MoreVertical, Edit, Share2, UserPlus, LogOut } from 'lucide-react';
import ChatPopup from '../components/ChatPopup';
import { membersApi } from '../api/events';
import { eventInvitationsApi } from '../api/eventInvitations';
import { friendsApi } from '../api/friends';
import type { Friend } from '../types/friend';

export default function EventRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // 獲取當前登入用戶信息
  
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 新 UI 相關狀態
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // 加入聚會相關狀態
  const [hasJoined, setHasJoined] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [joinForm, setJoinForm] = useState({
    nickname: '',
    shareLocation: true,
    travelMode: 'transit' as TravelMode,
  });
  const [joining, setJoining] = useState(false);

  // 「我到了」相關狀態
  const [hasArrived, setHasArrived] = useState(false);
  const [marking, setMarking] = useState(false);
  
  // 戳人相關狀態
  const [pokingMemberId, setPokingMemberId] = useState<number | null>(null);
  
  // 結果彈出視窗
  const [showResultPopup, setShowResultPopup] = useState(false);
  
  // 聊天室彈出視窗
  const [chatPopupOpen, setChatPopupOpen] = useState(false);
  
  // 編輯活動相關狀態
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    startTime: new Date(),
    endTime: new Date(),
    meetingPointName: '',
    meetingPointAddress: '',
    meetingPointLat: null as number | null,
    meetingPointLng: null as number | null,
  });
  
  // ETA 相關狀態（包含移動狀態和倒數模式）
  interface ETAState {
    eta: MemberETA['eta'];
    movementStarted: boolean;
    isCountdown: boolean;
    lastUpdated: number; // timestamp for countdown calculation
  }
  const [membersETA, setMembersETA] = useState<Map<number, ETAState>>(new Map());
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  // 更多按鈕 Menu 狀態
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const moreMenuOpen = Boolean(moreMenuAnchor);

  // 邀請好友 Dialog 狀態
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [inviting, setInviting] = useState(false);

  // 退出活動狀態
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Google Places Autocomplete refs
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps API when edit dialog opens
  useEffect(() => {
    if (editDialogOpen && !mapsLoaded) {
      loadGoogleMaps()
        .then(() => {
          setMapsLoaded(true);
        })
        .catch((err) => {
          console.error('Failed to load Google Maps:', err);
          setSnackbar({ open: true, message: 'Google Maps 載入失敗', severity: 'error' });
        });
    }
  }, [editDialogOpen, mapsLoaded]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!editDialogOpen || !mapsLoaded) {
      // Cleanup when dialog closes
      if (autocompleteRef.current) {
        if (typeof google !== 'undefined' && google.maps) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
        autocompleteRef.current = null;
      }
      return;
    }

    // Wait for Dialog to fully render before initializing Autocomplete
    let retryCount = 0;
    const maxRetries = 20; // 增加重試次數
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;
    
    const initAutocomplete = () => {
      // Check if input is ready
      if (!autocompleteInputRef.current) {
        if (retryCount < maxRetries) {
          retryCount++;
          rafId = requestAnimationFrame(initAutocomplete);
        } else {
          console.warn('[EventRoom] ⚠️ Autocomplete input ref not ready after max retries');
        }
        return;
      }

      // Clean up existing autocomplete if any (to ensure fresh initialization)
      if (autocompleteRef.current) {
        if (typeof google !== 'undefined' && google.maps) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
        autocompleteRef.current = null;
      }

      // Check if Google Maps API is ready
      if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        if (retryCount < maxRetries) {
          retryCount++;
          rafId = requestAnimationFrame(initAutocomplete);
        } else {
          console.warn('[EventRoom] ⚠️ Google Maps API not ready after max retries');
        }
        return;
      }

      try {
        // Initialize Autocomplete
        const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'tw' },
          fields: ['name', 'formatted_address', 'geometry', 'place_id'], // 明確指定需要的欄位
        });

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('[EventRoom] Place selected:', place);

          // 檢查 place 是否有效
          if (!place || place.place_id === undefined) {
            console.warn('[EventRoom] Invalid place selected:', place);
            setSnackbar({ open: true, message: '請從建議列表中選擇地點', severity: 'info' });
            return;
          }

          if (!place.geometry || !place.geometry.location) {
            console.warn('[EventRoom] Place missing geometry:', place);
            setSnackbar({ open: true, message: '找不到該地點的位置資訊', severity: 'error' });
            return;
          }

          // Update form data with selected place
          setEditFormData((prev) => ({
            ...prev,
            meetingPointName: place.name || place.formatted_address || '',
            meetingPointAddress: place.formatted_address || '',
            meetingPointLat: place.geometry!.location!.lat(),
            meetingPointLng: place.geometry!.location!.lng(),
          }));

          console.log('[EventRoom] ✓ Place data updated:', {
            name: place.name || place.formatted_address,
            lat: place.geometry!.location!.lat(),
            lng: place.geometry!.location!.lng(),
          });
          setSnackbar({ open: true, message: '地點已選擇', severity: 'success' });
        });

        autocompleteRef.current = autocomplete;
        console.log('[EventRoom] ✓ Google Places Autocomplete initialized', {
          inputElement: autocompleteInputRef.current,
          hasValue: autocompleteInputRef.current?.value || false,
        });

        // 設置 Google Places Autocomplete 建議列表的樣式
        // 使用 setTimeout 確保 pac-container 已經被創建
        setTimeout(() => {
          const pacContainer = document.querySelector('.pac-container') as HTMLElement;
          if (pacContainer) {
            pacContainer.style.zIndex = '1400';
            pacContainer.style.position = 'fixed';
            console.log('[EventRoom] ✓ Set pac-container z-index to 1400');
          } else {
            console.warn('[EventRoom] ⚠️ pac-container not found');
          }
        }, 500);
      } catch (error) {
        console.error('[EventRoom] ✗ Failed to initialize Autocomplete:', error);
        setSnackbar({ open: true, message: '地點搜尋功能初始化失敗', severity: 'error' });
      }
    };

    // Start initialization after a delay to ensure Dialog is rendered
    timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(initAutocomplete);
    }, 300);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      if (autocompleteRef.current) {
        if (typeof google !== 'undefined' && google.maps) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
        autocompleteRef.current = null;
      }
    };
  }, [editDialogOpen, mapsLoaded]);

  // 監聽 pac-container 的創建，確保樣式正確設置
  useEffect(() => {
    if (!editDialogOpen) return;

    // 使用 MutationObserver 監聽 pac-container 的創建
    const observer = new MutationObserver(() => {
      const pacContainer = document.querySelector('.pac-container') as HTMLElement;
      if (pacContainer) {
        pacContainer.style.zIndex = '1400';
        pacContainer.style.position = 'fixed';
        console.log('[EventRoom] ✓ pac-container style updated via MutationObserver');
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [editDialogOpen]);

  // 訂閱 Pusher Beams Device Interest（當用戶已加入活動時）
  useEffect(() => {
    if (!event || !currentMemberId) {
      return;
    }

    // Add a delay to ensure initialization is complete
    const subscribeToPushNotifications = async () => {
      try {
        // Wait a bit to ensure Pusher Beams is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Subscribe to device interest: event-{eventId}-member-{memberId}
        const interest = `event-${event.id}-member-${currentMemberId}`;
        console.log('[EventRoom] Attempting to subscribe to interest:', interest);
        
        const success = await subscribeToInterest(interest);
        
        if (success) {
          console.log('[EventRoom] ✓ Successfully subscribed to push notifications:', interest);
          
          // Verify subscription
          const { getSubscribedInterests } = await import('../lib/pusherBeams');
          const interests = await getSubscribedInterests();
          console.log('[EventRoom] Current subscribed interests:', interests);
        } else {
          console.warn('[EventRoom] ⚠️ Failed to subscribe to push notifications');
          console.warn('[EventRoom] Please check:');
          console.warn('  1. Service Worker is registered');
          console.warn('  2. Notification permission is granted');
          console.warn('  3. Pusher Beams client is initialized');
        }
      } catch (error) {
        console.error('[EventRoom] Error subscribing to push notifications:', error);
      }
    };

    subscribeToPushNotifications();

    // Cleanup: unsubscribe when component unmounts or member/event changes
    return () => {
      if (event && currentMemberId) {
        const interest = `event-${event.id}-member-${currentMemberId}`;
        unsubscribeFromInterest(interest).catch((error) => {
          console.error('[EventRoom] Error unsubscribing from push notifications:', error);
        });
      }
    };
  }, [event, currentMemberId]);

  // 整合 Pusher - 監聽 poke 事件
  usePusher({
    channelName: event ? `event-${event.id}` : null,
    eventName: 'poke',
    onEvent: (data: PokeEvent) => {
      console.log('[EventRoom] Received poke event:', {
        data,
        currentMemberId,
        toMemberId: data.toMemberId,
        matches: currentMemberId === data.toMemberId,
      });
      
      // 僅在收到 poke 事件且 toMemberId 匹配當前用戶的 memberId 時顯示通知
      if (currentMemberId && data.toMemberId === currentMemberId) {
        console.log('[EventRoom] Showing poke notification:', {
          fromNickname: data.fromNickname,
          count: data.count,
        });
        showPokeNotification(data.fromNickname, data.count);
        
        // 顯示 Snackbar 提示
        setSnackbar({
          open: true,
          message: `👆 ${data.fromNickname} 戳了你${data.count > 1 ? ` (${data.count} 次)` : ''}！`,
          severity: 'info',
        });
      } else {
        // 即使不是戳自己，也顯示誰戳了誰（可選，讓用戶知道活動中的互動）
        if (data.fromMemberId !== currentMemberId) {
          // 找到被戳的成員名稱
          const targetMember = members.find(m => m.id === data.toMemberId);
          const targetNickname = targetMember?.nickname || '某人';
          
          // 只在 Console 記錄，不顯示通知（避免打擾）
          console.log('[EventRoom] Poke event (not for you):', {
            from: data.fromNickname,
            to: targetNickname,
          });
        }
      }
    },
    onConnected: () => {
      console.log('[EventRoom] Pusher connected successfully');
    },
    onError: (error) => {
      console.error('[EventRoom] Pusher error:', error);
    },
    debug: true, // Enable debug logging
  });

  // 整合 Pusher - 監聽 member-joined 事件（成員加入）
  usePusher({
    channelName: event ? `event-${event.id}` : null,
    eventName: 'member-joined',
    onEvent: (data: MemberJoinedEvent) => {
      console.log('[EventRoom] Received member-joined event:', data);
      
      // 檢查成員是否已經存在（避免重複添加）
      const memberExists = members.some(m => m.id === data.memberId);
      if (memberExists) {
        console.log('[EventRoom] Member already exists, skipping:', data.memberId);
        return;
      }
      
      // 添加新成員到列表
      const newMember: Member = {
        id: data.memberId,
        userId: data.userId || null,
        eventId: event!.id,
        nickname: data.nickname,
        shareLocation: data.shareLocation,
        travelMode: data.travelMode || 'driving',
        lat: null,
        lng: null,
        address: null,
        arrivalTime: null,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
      };
      
      setMembers((prevMembers) => {
        const updatedMembers = [...prevMembers, newMember];
        
        // 重新排序：已到達的成員排在前面，然後是分享位置的，最後是其他
        return updatedMembers.sort((a, b) => {
          if (a.arrivalTime && !b.arrivalTime) return -1;
          if (!a.arrivalTime && b.arrivalTime) return 1;
          if (!a.arrivalTime && !b.arrivalTime) {
            if (a.shareLocation && !b.shareLocation) return -1;
            if (!a.shareLocation && b.shareLocation) return 1;
          }
          return 0;
        });
      });
      
      // 更新 event 中的成員資訊
      setEvent((prevEvent) => {
        if (!prevEvent) return null;
        return {
          ...prevEvent,
          members: [...(prevEvent.members || []), newMember],
        };
      });
      
      // 顯示通知（如果不是當前用戶）
      if (currentMemberId !== data.memberId) {
        setSnackbar({
          open: true,
          message: `👋 ${data.nickname} 加入了聚會！`,
          severity: 'info',
        });
      }
    },
    onConnected: () => {
      console.log('[EventRoom] Pusher connected for member-joined');
    },
    onError: (error) => {
      console.error('[EventRoom] Pusher error for member-joined:', error);
    },
    debug: true,
  });

  // 整合 Pusher - 監聽 member-arrived 事件（成員到達）
  usePusher({
    channelName: event ? `event-${event.id}` : null,
    eventName: 'member-arrived',
    onEvent: (data: MemberArrivedEvent) => {
      console.log('[EventRoom] Received member-arrived event:', data);
      
      // 更新成員列表：將到達的成員標記為已到達
      setMembers((prevMembers) => {
        const updatedMembers = prevMembers.map((member) => {
          if (member.id === data.memberId) {
            return {
              ...member,
              arrivalTime: data.arrivalTime,
            };
          }
          return member;
        });
        
        // 重新排序：已到達的成員排在前面
        return updatedMembers.sort((a, b) => {
          if (a.arrivalTime && !b.arrivalTime) return -1;
          if (!a.arrivalTime && b.arrivalTime) return 1;
          if (!a.arrivalTime && !b.arrivalTime) {
            if (a.shareLocation && !b.shareLocation) return -1;
            if (!a.shareLocation && b.shareLocation) return 1;
          }
          return 0;
        });
      });
      
      // 更新 event 中的成員資訊
      setEvent((prevEvent) => {
        if (!prevEvent) return null;
        return {
          ...prevEvent,
          members: prevEvent.members.map((member) => {
            if (member.id === data.memberId) {
              return {
                ...member,
                arrivalTime: data.arrivalTime,
              };
            }
            return member;
          }),
        };
      });
      
      // 如果是當前用戶到達，更新 hasArrived 狀態
      if (currentMemberId === data.memberId) {
        setHasArrived(true);
        
        // 更新 localStorage
        if (id) {
          const storageKey = `event_${id}_member`;
          const storedMember = localStorage.getItem(storageKey);
          if (storedMember) {
            const memberData = JSON.parse(storedMember);
            memberData.arrivalTime = data.arrivalTime;
            localStorage.setItem(storageKey, JSON.stringify(memberData));
          }
        }
      } else {
        // 顯示通知（如果不是當前用戶）
        const statusEmoji = data.status === 'early' ? '⚡' : data.status === 'ontime' ? '✅' : '⏰';
        setSnackbar({
          open: true,
          message: `${statusEmoji} ${data.nickname} 已到達！`,
          severity: 'success',
        });
      }
    },
    onConnected: () => {
      console.log('[EventRoom] Pusher connected for member-arrived');
    },
    onError: (error) => {
      console.error('[EventRoom] Pusher error for member-arrived:', error);
    },
    debug: true,
  });

  // 整合 Pusher - 監聽 location-update 事件（位置更新）
  usePusher({
    channelName: event ? `event-${event.id}` : null,
    eventName: 'location-update',
    onEvent: (data: LocationUpdateEvent) => {
      console.log('[EventRoom] Received location-update event:', data);
      
      // 更新成員列表中的位置資訊
      setMembers((prevMembers) => {
        return prevMembers.map((member) => {
          if (member.id === data.memberId) {
            return {
              ...member,
              lat: data.lat,
              lng: data.lng,
            };
          }
          return member;
        });
      });
      
      // 更新 event 中的成員位置資訊
      setEvent((prevEvent) => {
        if (!prevEvent) return null;
        return {
          ...prevEvent,
          members: prevEvent.members.map((member) => {
            if (member.id === data.memberId) {
              return {
                ...member,
                lat: data.lat,
                lng: data.lng,
              };
            }
            return member;
          }),
        };
      });
      
      // 注意：地圖上的標記會自動更新，因為 MapContainer 使用 members prop
      console.log('[EventRoom] Member location updated on map');
    },
    onConnected: () => {
      console.log('[EventRoom] Pusher connected for location-update');
    },
    onError: (error) => {
      console.error('[EventRoom] Pusher error for location-update:', error);
    },
    debug: true,
  });

  // 整合 Pusher - 監聽 event-updated 事件
  usePusher({
    channelName: event ? `event-${event.id}` : null,
    eventName: 'event-updated',
    onEvent: (data: { event: ApiEvent; updatedFields: string[]; timestamp: string }) => {
      console.log('[EventRoom] Received event-updated event:', data);
      
      // 更新本地 event 狀態（即使主揪也需要更新，因為可能有多個標籤頁）
      setEvent(data.event);
      
      // 如果地點改變，地圖會自動更新（因為 mapCenter 和 mapMarkers 依賴 event）
      // 如果時間改變，位置追蹤會自動重新計算時間窗
      
      // 顯示通知（只有當不是主揪自己編輯時才顯示）
      // 主揪已經通過 API 響應更新了狀態並顯示了成功通知，不需要重複通知
      if (!isOwner) {
        const updatedFields = data.updatedFields || [];
        let message = '活動資訊已更新';
        
        if (updatedFields.includes('name')) {
          message = `活動名稱已更改為：${data.event.name}`;
        } else if (updatedFields.includes('startTime') || updatedFields.includes('endTime')) {
          message = '活動時間已更改';
        } else if (updatedFields.some(f => f.startsWith('meetingPoint'))) {
          message = '集合地點已更改';
        }
        
        setSnackbar({ 
          open: true, 
          message, 
          severity: 'info' 
        });
      }
    },
    onError: (error) => {
      console.error('[EventRoom] Pusher event-updated error:', error);
    },
    debug: true,
  });

  // 整合 Pusher - 監聽 event-ended 事件
  usePusher({
    channelName: event ? `event-${event.id}` : null,
    eventName: 'event-ended',
    onEvent: (data: EventEndedEvent) => {
      console.log('[EventRoom] Received event-ended event:', data);
      setEvent((prevEvent) => (prevEvent ? { ...prevEvent, status: 'ended' } : null));
      setSnackbar({ 
        open: true, 
        message: '🎊 聚會已結束！查看排行榜結果', 
        severity: 'info' 
      });
      // 5 秒後自動顯示結果彈出視窗
      setTimeout(() => {
        setShowResultPopup(true);
      }, 5000);
    },
    onError: (error) => {
      console.error('[EventRoom] Pusher event-ended error:', error);
    },
    debug: true,
  });

  // 使用進度條 hook（始終調用，內部處理 null）
  useEventProgress(event);

  // 檢查 event 是否已結束（用於顯示「查看結果」按鈕）
  const isEventEnded = useMemo(() => {
    if (!event) return false;
    if (event.status === 'ended') return true;
    // 如果現在時間超過 endTime，也視為已結束
    const now = new Date();
    const endTime = new Date(event.endTime);
    return now > endTime;
  }, [event]);

  // 位置追蹤 hook
  const currentMember = members.find(m => m.id === currentMemberId);
  useLocationTracking({
    enabled: hasJoined && (currentMember?.shareLocation || false),
    eventId: Number(id || 0),
    shareLocation: currentMember?.shareLocation || false,
    hasJoined,
    startTime: event?.startTime || '',
    endTime: event?.endTime || '',
    onError: (error: any) => {
      // 只在開發模式或非 400 錯誤時記錄詳細錯誤
      const isValidationError = error?.response?.status === 400;
      const errorMessage = error?.response?.data?.message || error?.message || '位置追蹤錯誤';
      
      if (!isValidationError || import.meta.env.DEV) {
        console.error('[EventRoom] Location tracking error:', {
          error,
          status: error?.response?.status,
          message: errorMessage,
          code: error?.response?.data?.code,
        });
      }
      
      // 只在非驗證錯誤或開發模式下顯示錯誤提示（避免打擾用戶）
      if (!isValidationError || import.meta.env.DEV) {
        setSnackbar({
          open: true,
          message: `位置追蹤錯誤: ${errorMessage}`,
          severity: 'error',
        });
      }
    },
    onLocationUpdate: (lat, lng) => {
      // 立即更新当前用户的位置，让地图立即显示
      if (currentMemberId) {
        console.log('[EventRoom] Immediately updating current member location on map', {
          memberId: currentMemberId,
          lat,
          lng,
        });
        
        setMembers((prevMembers) => {
          return prevMembers.map((member) => {
            if (member.id === currentMemberId) {
              return {
                ...member,
                lat,
                lng,
              };
            }
            return member;
          });
        });
        
        // 同时更新 event 中的成员位置
        setEvent((prevEvent) => {
          if (!prevEvent) return null;
          return {
            ...prevEvent,
            members: prevEvent.members.map((member) => {
              if (member.id === currentMemberId) {
                return {
                  ...member,
                  lat,
                  lng,
                };
              }
              return member;
            }),
          };
        });
      }
    },
  });

  // 初始化 ETA（只獲取一次，之後依賴 Pusher 推送）
  useEffect(() => {
    if (!event || !id || !event.meetingPointLat || !event.meetingPointLng) {
      return;
    }

    const fetchInitialETA = async () => {
      try {
        const response = await eventsApi.getMembersETA(Number(id));
        const etaMap = new Map<number, ETAState>();
        const now = Date.now();
        response.members.forEach((member) => {
          etaMap.set(member.memberId, {
            eta: member.eta,
            movementStarted: member.movementStarted ?? false,
            isCountdown: member.isCountdown ?? false,
            lastUpdated: now,
          });
        });
        setMembersETA(etaMap);
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.warn('[EventRoom] Failed to fetch initial ETA:', error);
        }
      }
    };

    fetchInitialETA();
  }, [event, id]);

  // 訂閱 Pusher eta-update 事件
  usePusher({
    channelName: event ? `event-${event.id}` : null,
    eventName: 'eta-update',
    onEvent: (data: ETAUpdateEvent) => {
      if (import.meta.env.DEV) {
        console.log('[EventRoom] Received eta-update event:', {
          memberId: data.memberId,
          eta: data.eta,
          etaText: data.etaText,
          movementStarted: data.movementStarted,
          isCountdown: data.isCountdown,
        });
      }
      setMembersETA(prev => {
        const newMap = new Map(prev);
        newMap.set(data.memberId, {
          eta: data.eta !== null ? {
            duration: data.etaText || '',
            durationValue: data.eta,
            distance: data.distance || '',
          } : null,
          movementStarted: data.movementStarted,
          isCountdown: data.isCountdown,
          lastUpdated: data.timestamp,
        });
        return newMap;
      });
    },
  });

  // Transit 模式本地倒數（每秒更新一次）
  useEffect(() => {
    const interval = setInterval(() => {
      setMembersETA(prev => {
        let hasChanges = false;
        const newMap = new Map(prev);
        
        prev.forEach((state, memberId) => {
          // 只對 isCountdown 模式且有有效 ETA 的成員進行倒數
          if (state.isCountdown && state.eta && state.eta.durationValue > 0) {
            const elapsed = Math.floor((Date.now() - state.lastUpdated) / 1000);
            const newDurationValue = Math.max(0, state.eta.durationValue - elapsed);
            
            // 只有當值有變化時才更新
            if (newDurationValue !== state.eta.durationValue) {
              hasChanges = true;
              newMap.set(memberId, {
                ...state,
                eta: {
                  ...state.eta,
                  durationValue: newDurationValue,
                  duration: formatDuration(newDurationValue),
                },
                lastUpdated: Date.now(), // 重置時間戳
              });
            }
          }
        });
        
        return hasChanges ? newMap : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 格式化秒數為可讀文字
  const formatDuration = (seconds: number): string => {
    if (seconds <= 0) return '即將到達';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} 小時 ${minutes} 分鐘`;
    }
    return `${minutes} 分鐘`;
  };

  // 載入 Event 數據
  useEffect(() => {
    if (!id) {
      setError('找不到聚會 ID');
      setLoading(false);
      return;
    }

    // 檢查 localStorage 是否已加入此聚會
    const storageKey = `event_${id}_member`;
    const storedMember = localStorage.getItem(storageKey);
    let savedMemberData: any = null;
    
    if (storedMember) {
      try {
        savedMemberData = JSON.parse(storedMember);
        setHasJoined(true);
        setCurrentMemberId(savedMemberData.memberId);
        setHasArrived(!!savedMemberData.arrivalTime);
      } catch (e) {
        console.error('Failed to parse stored member data:', e);
      }
    }

    // 等待 auth 載入完成後再檢查（避免在 user 未載入時檢查）
    if (authLoading) {
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

        setEvent(response.event);
        
        // 檢查當前用戶是否是成員（優先檢查 localStorage，然後檢查已登入用戶）
        let currentMember: Member | undefined;
        
        // 方法 1: 檢查 localStorage 中的 guest member
        if (savedMemberData && savedMemberData.memberId) {
          currentMember = response.event.members.find(m => m.id === savedMemberData.memberId);
          if (currentMember) {
            setHasJoined(true);
            setCurrentMemberId(currentMember.id);
            setHasArrived(!!currentMember.arrivalTime);
            
            // 更新 localStorage 中的數據（確保與 API 同步）
            localStorage.setItem(storageKey, JSON.stringify({
              ...savedMemberData,
              arrivalTime: currentMember.arrivalTime,
              lat: currentMember.lat,
              lng: currentMember.lng,
              address: currentMember.address,
              shareLocation: currentMember.shareLocation,
              travelMode: currentMember.travelMode,
            }));
          } else {
            // 如果成員不存在，清除 localStorage
            localStorage.removeItem(storageKey);
          }
        }
        
        // 方法 2: 如果沒有找到 guest member，檢查已登入用戶是否在 members 列表中
        if (!currentMember && user?.userId) {
          currentMember = response.event.members.find(m => m.userId === user.userId);
          if (currentMember) {
            console.log('[EventRoom] Found logged-in user in members list:', {
              userId: user.userId,
              memberId: currentMember.id,
              nickname: currentMember.nickname,
            });
            setHasJoined(true);
            setCurrentMemberId(currentMember.id);
            setHasArrived(!!currentMember.arrivalTime);
            
            // 將已登入用戶的 member 資料也保存到 localStorage（方便後續使用）
            localStorage.setItem(storageKey, JSON.stringify({
              memberId: currentMember.id,
              userId: currentMember.userId,
              nickname: currentMember.nickname,
              shareLocation: currentMember.shareLocation,
              travelMode: currentMember.travelMode,
              arrivalTime: currentMember.arrivalTime,
              lat: currentMember.lat,
              lng: currentMember.lng,
              address: currentMember.address,
              createdAt: currentMember.createdAt,
              updatedAt: currentMember.updatedAt,
            }));
          }
        }
        
        // 如果都沒有找到，確保狀態正確
        if (!currentMember) {
          setHasJoined(false);
          setCurrentMemberId(null);
          setHasArrived(false);
        }
        
        // 排序成員：已到達 → 分享位置中 → 前往中
        const sortedMembers = (response.event.members || []).sort((a, b) => {
          if (a.arrivalTime && !b.arrivalTime) return -1;
          if (!a.arrivalTime && b.arrivalTime) return 1;
          if (!a.arrivalTime && !b.arrivalTime) {
            if (a.shareLocation && !b.shareLocation) return -1;
            if (!a.shareLocation && b.shareLocation) return 1;
          }
          return 0;
        });
        setMembers(sortedMembers);
        setLoading(false);
      } catch (err: any) {
        console.error('載入聚會失敗:', err);
        setError(err.response?.data?.message || '載入聚會失敗');
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user, authLoading]);

  // 加入聚會
  const handleJoinEvent = async () => {
    if (!event || !id) return;
    
    if (!joinForm.nickname.trim()) {
      setSnackbar({ open: true, message: '請輸入暱稱', severity: 'error' });
      return;
    }

    setJoining(true);
    
    try {
      // 使用真實 API
      const response = await eventsApi.joinEvent(Number(id), {
        nickname: joinForm.nickname.trim(),
        shareLocation: joinForm.shareLocation,
        travelMode: joinForm.travelMode,
      });
      
      const { member, guestToken } = response;
      
      // 儲存到 localStorage（完整成員信息 + guest token）
      const storageKey = `event_${id}_member`;
      localStorage.setItem(storageKey, JSON.stringify({
        memberId: member.id,
        userId: member.userId,
        nickname: member.nickname || joinForm.nickname,
        shareLocation: member.shareLocation,
        travelMode: member.travelMode || joinForm.travelMode,
        guestToken: guestToken, // 保存真實的 guest token
        arrivalTime: member.arrivalTime,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      }));
      
      setHasJoined(true);
      setCurrentMemberId(member.id);
      
      // 重新獲取 event 以獲取最新成員列表（包含新加入的成員）
      const eventResponse = await eventsApi.getEvent(Number(id));
      const updatedMembers = (eventResponse.event.members || []).sort((a, b) => {
        if (a.arrivalTime && !b.arrivalTime) return -1;
        if (!a.arrivalTime && b.arrivalTime) return 1;
        if (!a.arrivalTime && !b.arrivalTime) {
          if (a.shareLocation && !b.shareLocation) return -1;
          if (!a.shareLocation && b.shareLocation) return 1;
        }
        return 0;
      });
      
      setMembers(updatedMembers);
      setEvent(eventResponse.event);
      
      setSnackbar({ open: true, message: '成功加入聚會！', severity: 'success' });
    } catch (err: any) {
      console.error('加入聚會失敗:', err);
      const errorMessage = err.response?.data?.message || err.message || '加入失敗，請稍後再試';
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setJoining(false);
    }
  };

  // 標記「我到了」
  const handleMarkArrival = async () => {
    if (!event || !id || !currentMemberId) return;
    
    setMarking(true);
    
    try {
      // 使用真實 API
      const response = await eventsApi.markArrival(Number(id));
      
      // 更新本地狀態
      setHasArrived(true);
      
      // 更新 localStorage
      const storageKey = `event_${id}_member`;
      const storedMember = localStorage.getItem(storageKey);
      if (storedMember) {
        const memberData = JSON.parse(storedMember);
        memberData.arrivalTime = response.arrivalTime;
        localStorage.setItem(storageKey, JSON.stringify(memberData));
      }
      
      // 重新獲取 event 以獲取最新成員列表
      const eventResponse = await eventsApi.getEvent(Number(id));
      const updatedMembers = (eventResponse.event.members || []).sort((a, b) => {
        if (a.arrivalTime && !b.arrivalTime) return -1;
        if (!a.arrivalTime && b.arrivalTime) return 1;
        if (!a.arrivalTime && !b.arrivalTime) {
          if (a.shareLocation && !b.shareLocation) return -1;
          if (!a.shareLocation && b.shareLocation) return 1;
        }
        return 0;
      });
      
      setMembers(updatedMembers);
      setEvent(eventResponse.event);
      
      const statusEmoji = response.status === 'early' ? '⚡' : response.status === 'ontime' ? '✅' : '⏰';
      setSnackbar({ 
        open: true, 
        message: `${statusEmoji} 已標記到達！${response.status === 'late' ? ` (遲到 ${response.lateMinutes} 分鐘)` : ''}`, 
        severity: 'success' 
      });
    } catch (err: any) {
      console.error('標記到達失敗:', err);
      const errorMessage = err.response?.data?.message || err.message || '標記失敗，請稍後再試';
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setMarking(false);
    }
  };

  // 檢查是否為主揪
  const isOwner = useMemo(() => {
    if (!event) return false;
    
    // 檢查已登入用戶
    if (user?.userId && event.ownerId === user.userId) {
      return true;
    }
    
    // 檢查匿名用戶（從 localStorage）
    if (!user && id) {
      const storageKey = `event_${id}_member`;
      const storedMember = localStorage.getItem(storageKey);
      if (storedMember) {
        try {
          const memberData = JSON.parse(storedMember);
          // 檢查是否是 owner（通過比較 userId）
          if (memberData.userId && event.ownerId === memberData.userId) {
            return true;
          }
        } catch (e) {
          console.error('Failed to parse stored member data:', e);
        }
      }
    }
    
    return false;
  }, [event, user, id]);

  // 打開編輯對話框
  // 更多按鈕 Menu 處理
  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleShareLink = async () => {
    handleMoreMenuClose();
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.name || '活動邀請',
          text: `邀請你參加活動：${event?.name || ''}`,
          url: window.location.href,
        });
        setSnackbar({ open: true, message: '分享成功！', severity: 'success' });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setSnackbar({ open: true, message: '已複製連結！', severity: 'success' });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.href);
        setSnackbar({ open: true, message: '已複製連結！', severity: 'success' });
      }
    }
  };

  const handleOpenInviteDialog = async () => {
    handleMoreMenuClose();
    setInviteDialogOpen(true);
    setLoadingFriends(true);
    try {
      const response = await friendsApi.getFriends();
      // 過濾已加入活動的好友
      const memberUserIds = new Set(members.map(m => m.userId).filter(Boolean));
      const availableFriends = response.friends.filter(f => !memberUserIds.has(f.userId));
      setFriends(availableFriends);
    } catch (error: any) {
      console.error('[EventRoom] Failed to load friends:', error);
      setSnackbar({
        open: true,
        message: '載入好友列表失敗',
        severity: 'error',
      });
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setSelectedFriends([]);
  };

  const handleToggleFriendSelection = (userId: string) => {
    setSelectedFriends(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendInvitations = async () => {
    if (selectedFriends.length === 0 || !event) return;

    setInviting(true);
    try {
      await eventInvitationsApi.createInvitations(event.id, {
        invitedUserIds: selectedFriends,
      });
      setSnackbar({
        open: true,
        message: `已邀請 ${selectedFriends.length} 位好友`,
        severity: 'success',
      });
      handleCloseInviteDialog();
    } catch (error: any) {
      console.error('[EventRoom] Failed to send invitations:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '邀請失敗',
        severity: 'error',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleOpenLeaveDialog = () => {
    handleMoreMenuClose();
    setLeaveDialogOpen(true);
  };

  const handleCloseLeaveDialog = () => {
    setLeaveDialogOpen(false);
  };

  const handleLeaveEvent = async () => {
    if (!currentMemberId) return;

    setLeaving(true);
    try {
      await membersApi.removeMember(currentMemberId);
      setSnackbar({
        open: true,
        message: '已退出活動',
        severity: 'success',
      });
      handleCloseLeaveDialog();
      // 導航回活動列表
      setTimeout(() => {
        navigate('/events');
      }, 1000);
    } catch (error: any) {
      console.error('[EventRoom] Failed to leave event:', error);
      const errorMessage = error.response?.data?.message || '退出失敗';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLeaving(false);
    }
  };

  const handleOpenEditDialog = () => {
    handleMoreMenuClose();
    if (!event) return;
    
    setEditFormData({
      name: event.name,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      meetingPointName: event.meetingPointName || '',
      meetingPointAddress: event.meetingPointAddress || '',
      meetingPointLat: event.meetingPointLat ?? null,
      meetingPointLng: event.meetingPointLng ?? null,
    });
    setEditDialogOpen(true);
  };

  // 關閉編輯對話框
  const handleCloseEditDialog = () => {
    // 重置表單數據為當前活動數據，確保下次打開時顯示最新數據
    if (event) {
      setEditFormData({
        name: event.name,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        meetingPointName: event.meetingPointName || '',
        meetingPointAddress: event.meetingPointAddress || '',
        meetingPointLat: event.meetingPointLat ?? null,
        meetingPointLng: event.meetingPointLng ?? null,
      });
    }
    setEditDialogOpen(false);
  };

  // 更新活動
  const handleUpdateEvent = async () => {
    if (!event || !id) return;
    
    // 驗證表單
    if (!editFormData.name.trim()) {
      setSnackbar({
        open: true,
        message: '請輸入活動名稱',
        severity: 'error',
      });
      return;
    }
    
    if (editFormData.endTime <= editFormData.startTime) {
      setSnackbar({
        open: true,
        message: '結束時間必須晚於開始時間',
        severity: 'error',
      });
      return;
    }
    
    setUpdating(true);
    
    try {
      const updateData: any = {
        name: editFormData.name.trim(),
        startTime: editFormData.startTime.toISOString(),
        endTime: editFormData.endTime.toISOString(),
      };
      
      // 驗證地點資訊
      // 如果輸入了地點名稱但沒有選擇（沒有座標），提示用戶
      if (editFormData.meetingPointName && (!editFormData.meetingPointLat || !editFormData.meetingPointLng)) {
        setSnackbar({
          open: true,
          message: '請從建議列表中選擇地點，或清空地點欄位',
          severity: 'info',
        });
        setUpdating(false);
        return;
      }
      
      // 如果提供了完整的地點資訊，添加到更新數據
      if (editFormData.meetingPointName && editFormData.meetingPointLat && editFormData.meetingPointLng) {
        updateData.meetingPointName = editFormData.meetingPointName;
        updateData.meetingPointAddress = editFormData.meetingPointAddress || null;
        updateData.meetingPointLat = editFormData.meetingPointLat;
        updateData.meetingPointLng = editFormData.meetingPointLng;
      } else {
        // 如果清空了地點，設為 null
        updateData.meetingPointName = null;
        updateData.meetingPointAddress = null;
        updateData.meetingPointLat = null;
        updateData.meetingPointLng = null;
      }
      
      // 對於匿名用戶，需要傳遞 ownerId
      if (!user && event && id) {
        const storageKey = `event_${id}_member`;
        const storedMember = localStorage.getItem(storageKey);
        if (storedMember) {
          try {
            const memberData = JSON.parse(storedMember);
            if (memberData.userId && event.ownerId === memberData.userId) {
              updateData.ownerId = memberData.userId;
            }
          } catch (e) {
            console.error('Failed to parse stored member data:', e);
          }
        }
      }
      
      const response = await eventsApi.updateEvent(Number(id), updateData);
      
      // 更新本地狀態
      setEvent(response.event);
      
      // 如果地點改變，需要更新地圖
      // 如果時間改變，位置追蹤會自動重新計算時間窗
      
      setSnackbar({
        open: true,
        message: '活動資訊已更新',
        severity: 'success',
      });
      
      handleCloseEditDialog();
    } catch (err: any) {
      console.error('更新活動失敗:', err);
      const errorMessage = err.response?.data?.message || err.message || '更新失敗，請稍後再試';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  // 戳人
  const handlePokeMember = async (targetMemberId: number) => {
    if (!event || !id || !currentMemberId || targetMemberId === currentMemberId) {
      console.log('[EventRoom] Cannot poke:', {
        hasEvent: !!event,
        eventId: id,
        currentMemberId,
        targetMemberId,
        reason: !event ? 'no event' : !id ? 'no id' : !currentMemberId ? 'no currentMemberId' : 'self poke',
      });
      return;
    }
    
    console.log('[EventRoom] Poking member:', {
      eventId: id,
      currentMemberId,
      targetMemberId,
      timestamp: new Date().toISOString(),
    });
    
    setPokingMemberId(targetMemberId);
    
    try {
      const response = await eventsApi.pokeMember(Number(id), targetMemberId);
      
      console.log('[EventRoom] ✓ Poke API response:', response);
      
      const targetMember = members.find(m => m.id === targetMemberId);
      const targetNickname = targetMember?.nickname || '成員';
      
      setSnackbar({ 
        open: true, 
        message: `👆 已戳 ${targetNickname}！(${response.pokeCount}/3 次)`, 
        severity: 'success' 
      });
    } catch (err: any) {
      console.error('[EventRoom] ✗ Poke API error:', {
        error: err,
        message: err?.message,
        response: err?.response?.data,
        eventId: id,
        targetMemberId,
      });
      const errorMessage = err.response?.data?.message || err.message || '戳人失敗，請稍後再試';
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setPokingMemberId(null);
    }
  };

  // 取得狀態文字
  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '即將開始';
      case 'ongoing':
        return '進行中';
      case 'ended':
        return '已結束';
      default:
        return status;
    }
  };

  // Memoize 地圖中心點，避免重新渲染
  const mapCenter = useMemo(() => {
    if (event?.meetingPointLat && event?.meetingPointLng) {
      return { lat: event.meetingPointLat, lng: event.meetingPointLng };
    }
    return undefined;
  }, [event?.meetingPointLat, event?.meetingPointLng]);

  // Memoize 地圖標記，避免重新渲染
  const mapMarkers = useMemo(() => {
    const markers = [];

    // 集合地點標記（使用固定 ID 以便追蹤和更新）
    if (event?.meetingPointLat && event?.meetingPointLng) {
      markers.push({
        id: -1, // 使用 -1 作為集合地點的唯一 ID
        lat: event.meetingPointLat,
        lng: event.meetingPointLng,
        title: event.meetingPointName || '集合地點',
        label: '📍',
        address: event.meetingPointAddress,
      });
    }

    // 成員位置標記
    members
      .filter((m) => m.lat && m.lng && m.shareLocation)
      .forEach((m) => {
        const etaState = membersETA.get(m.id);
        const eta = etaState?.eta;
        // 顯示 ETA 或「等待出發」
        let etaText = '';
        if (etaState && !etaState.movementStarted) {
          etaText = '等待出發...';
        } else if (eta) {
          etaText = `約 ${eta.duration}`;
        }
        const title = m.arrivalTime 
          ? `${m.nickname || '成員'} - 已到達`
          : `${m.nickname || '成員'}${etaText ? ` - ${etaText}` : ''}`;
        
        markers.push({
          id: m.id, // 使用成員 ID 作為標記 ID
          lat: m.lat!,
          lng: m.lng!,
          title,
          label: m.arrivalTime ? '✅' : (m.nickname?.charAt(0) || '?'),
          avatarUrl: m.avatar || undefined,
        });
      });

    return markers;
  }, [event?.meetingPointLat, event?.meetingPointLng, event?.meetingPointName, event?.meetingPointAddress, members, membersETA]);

  // 計算兩點間距離（公尺）- Haversine 公式
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球半徑（公尺）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // 計算用戶與集合地點的距離
  const distanceToMeetingPoint = useMemo(() => {
    const myMember = members.find(m => m.id === currentMemberId);
    if (!myMember?.lat || !myMember?.lng || !event?.meetingPointLat || !event?.meetingPointLng) {
      return null;
    }
    return calculateDistance(
      myMember.lat, myMember.lng,
      event.meetingPointLat, event.meetingPointLng
    );
  }, [members, currentMemberId, event?.meetingPointLat, event?.meetingPointLng]);

  // 距離門檻：100 公尺內才能標記到達
  const ARRIVAL_THRESHOLD = 100;
  const canMarkArrival = distanceToMeetingPoint !== null && distanceToMeetingPoint <= ARRIVAL_THRESHOLD;

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
  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || '無法載入聚會資訊'}
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

  // 未加入狀態 - 顯示聚會預覽和加入表單
  if (!hasJoined) {
    return (
      <Box sx={{ bgcolor: '#fafafa', minHeight: 'calc(100vh - 64px)', py: 4 }}>
        <Container maxWidth="md">
          {/* 聚會預覽卡片 */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Chip
              label={getStatusText(event.status)}
              size="small"
              sx={{
                mb: 3,
                bgcolor: event.status === 'ongoing' ? '#e8f5e9' : '#f5f5f5',
                color: event.status === 'ongoing' ? '#2e7d32' : 'text.secondary',
                fontWeight: 500,
              }}
            />
            
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
              你被邀請參加：{event.name}
            </Typography>

            {/* 聚會詳情 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TimeIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.875rem' }}>
                  {new Date(event.startTime).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    weekday: 'short',
                  })}
                </Typography>
              </Box>

              {event.meetingPointName && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <LocationIcon sx={{ color: 'text.secondary', fontSize: 18, mt: 0.25 }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.875rem' }}>
                      {event.meetingPointName}
                    </Typography>
                    {event.meetingPointAddress && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {event.meetingPointAddress}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PeopleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.875rem' }}>
                  {members.length} 位成員已加入
                </Typography>
              </Box>

              {/* 主揪資訊 */}
              {(() => {
                // 嘗試從 members 中找到 owner 的 member 記錄
                const ownerMember = event.members?.find(m => m.userId === event.ownerId);
                const ownerDisplayName = ownerMember?.nickname || 
                  (event.ownerId.includes('_') 
                    ? event.ownerId.split('_')[0] 
                    : event.ownerId);
                
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.875rem' }}>
                      主揪：{ownerDisplayName}
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          </Paper>

          {/* 加入表單 */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
              加入聚會
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="你的暱稱"
                placeholder="例如：小明"
                value={joinForm.nickname}
                onChange={(e) => setJoinForm({ ...joinForm, nickname: e.target.value })}
                fullWidth
                required
              />

              <FormControl fullWidth>
                <InputLabel>交通方式</InputLabel>
                <Select
                  value={joinForm.travelMode}
                  onChange={(e) => setJoinForm({ ...joinForm, travelMode: e.target.value as TravelMode })}
                  label="交通方式"
                >
                  <MenuItem value="driving">🚗 開車</MenuItem>
                  <MenuItem value="transit">🚇 大眾運輸</MenuItem>
                  <MenuItem value="walking">🚶 步行</MenuItem>
                  <MenuItem value="bicycling">🚴 騎車</MenuItem>
                  <MenuItem value="motorcycle">🏍️ 機車</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={joinForm.shareLocation}
                    onChange={(e) => setJoinForm({ ...joinForm, shareLocation: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      分享我的位置
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      我們會在聚會前後 30 分鐘內追蹤你的位置
                    </Typography>
                  </Box>
                }
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleJoinEvent}
                disabled={joining}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {joining ? <CircularProgress size={24} /> : '加入聚會'}
              </Button>
            </Box>
          </Paper>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            message={snackbar.message}
          />
        </Container>
      </Box>
    );
  }

  // 已加入狀態 - 顯示完整 EventRoom（新 UI）
  // 取得主揪資訊
  const ownerMember = event.members?.find(m => m.userId === event.ownerId);
  const ownerDisplayName = ownerMember?.nickname || 
    (event.ownerId.includes('_') 
      ? event.ownerId.split('_')[0] 
      : event.ownerId);

  return (
    <Box sx={{ 
      position: 'fixed', 
      inset: 0, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f1f5f9',
      overflow: 'hidden',
      zIndex: 1200  // 高於 MUI AppBar 的 1100，完全覆蓋 Navbar
    }}>
      {/* 全屏地圖背景 */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapContainer center={mapCenter} markers={mapMarkers} fullscreen />
      </Box>

      {/* 浮動 Header */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        p: 2, 
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* 返回按鈕（絕對定位左上角） */}
        <IconButton
          onClick={() => navigate('/events')}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 48,
            height: 48,
            bgcolor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.4)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            '&:active': { transform: 'scale(0.9)' },
            transition: 'all 0.2s',
            zIndex: 10,
          }}
        >
          <ArrowBackIcon sx={{ color: '#475569' }} />
        </IconButton>

        {/* 可展開的聚會資訊 Pill（置中） */}
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          mb: 2,
        }}>
          <Box
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              cursor: 'pointer',
              width: isInfoExpanded ? '80%' : 'auto',
              maxWidth: isInfoExpanded ? 400 : 'none',
              p: isInfoExpanded ? 2.5 : 1.5,
              px: isInfoExpanded ? 2.5 : 2,
              bgcolor: isInfoExpanded ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
              borderRadius: isInfoExpanded ? 4 : 6,
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            {!isInfoExpanded ? (
              // 收合狀態
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  bgcolor: event.status === 'ongoing' ? '#3b82f6' : '#94a3b8',
                  borderRadius: '50%',
                  animation: event.status === 'ongoing' ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                  {event.name}
                </Typography>
                {event.status === 'upcoming' ? (
                  <Countdown
                    date={new Date(event.startTime)}
                    renderer={({ total, completed }) => {
                      // 計算總分鐘數（向上取整，確保顯示準確）
                      const totalMinutes = Math.ceil(total / (1000 * 60));
                      
                      // 如果已經開始或超過 30 分鐘，顯示時間
                      if (completed || totalMinutes > 30) {
                        return (
                          <>
                            <TimeIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                              {format(new Date(event.startTime), 'HH:mm')}
                            </Typography>
                          </>
                        );
                      }
                      
                      // 如果少於 1 分鐘，顯示「即將開始」
                      if (totalMinutes < 1) {
                        return (
                          <>
                            <TimeIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                              即將開始
                            </Typography>
                          </>
                        );
                      }
                      
                      // 顯示倒數計時
                      return (
                        <>
                          <TimeIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                            還有 {totalMinutes} 分鐘
                          </Typography>
                        </>
                      );
                    }}
                  />
                ) : (
                  <>
                    <TimeIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                      {format(new Date(event.startTime), 'HH:mm')}
                    </Typography>
                  </>
                )}
              </Box>
            ) : (
              // 展開狀態
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ 
                      fontSize: '0.625rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.1em',
                      color: '#3b82f6',
                      mb: 0.5,
                    }}>
                      {event.status === 'ongoing' ? '進行中' : event.status === 'upcoming' ? '即將開始' : '已結束'}
                    </Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                      {event.name}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                  }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* 地點 */}
                  {event.meetingPointName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        width: 32, height: 32, 
                        bgcolor: '#dbeafe', 
                        borderRadius: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <LocationIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                          {event.meetingPointName}
                        </Typography>
                        {event.meetingPointAddress && (
                          <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8' }}>
                            {event.meetingPointAddress}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  
                  {/* 時間 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 32, height: 32, 
                      bgcolor: '#ffedd5', 
                      borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TimeIcon sx={{ fontSize: 16, color: '#f97316' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                        {format(new Date(event.startTime), 'HH:mm')} – {format(new Date(event.endTime), 'HH:mm')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8' }}>
                        {format(new Date(event.startTime), 'yyyy/MM/dd (EEEE)', { locale: zhTW })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 主揪 + 分享 + 編輯 */}
                <Box sx={{ 
                  pt: 2, 
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 24, height: 24, 
                      borderRadius: '50%', 
                      bgcolor: '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.5rem', fontWeight: 700,
                    }}>
                      {ownerDisplayName.charAt(0).toUpperCase()}
                    </Box>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: '#94a3b8' }}>
                      主揪：{ownerDisplayName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      onClick={handleMoreMenuOpen}
                      sx={{
                        color: '#3b82f6',
                        p: 0.5,
                        '&:hover': { bgcolor: '#eff6ff' },
                      }}
                    >
                      <MoreVertical size={18} />
                    </IconButton>
                    <Menu
                      anchorEl={moreMenuAnchor}
                      open={moreMenuOpen}
                      onClose={handleMoreMenuClose}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      PaperProps={{
                        sx: {
                          borderRadius: 2,
                          mt: 1,
                          minWidth: 180,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      {isOwner && (
                        <MenuItem
                          onClick={handleOpenEditDialog}
                          sx={{
                            py: 1.5,
                            px: 2,
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Edit size={18} color="#3b82f6" />
                          </ListItemIcon>
                          <ListItemText
                            primary="編輯活動"
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#0f172a',
                            }}
                          />
                        </MenuItem>
                      )}
                      <MenuItem
                        onClick={handleShareLink}
                        sx={{
                          py: 1.5,
                          px: 2,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Share2 size={18} color="#3b82f6" />
                        </ListItemIcon>
                        <ListItemText
                          primary="分享連結"
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#0f172a',
                          }}
                        />
                      </MenuItem>
                      <MenuItem
                        onClick={handleOpenInviteDialog}
                        sx={{
                          py: 1.5,
                          px: 2,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <UserPlus size={18} color="#3b82f6" />
                        </ListItemIcon>
                        <ListItemText
                          primary="邀請好友"
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#0f172a',
                          }}
                        />
                      </MenuItem>
                      {!isOwner && (
                        <>
                          <Divider sx={{ my: 0.5 }} />
                          <MenuItem
                            onClick={handleOpenLeaveDialog}
                            sx={{
                              py: 1.5,
                              px: 2,
                              color: '#ef4444',
                              '&:hover': {
                                bgcolor: '#fef2f2',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <LogOut size={18} color="#ef4444" />
                            </ListItemIcon>
                            <ListItemText
                              primary="退出活動"
                              primaryTypographyProps={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#ef4444',
                              }}
                            />
                          </MenuItem>
                        </>
                      )}
                    </Menu>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* 右上角按鈕群組 */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 10,
          }}
        >
            {/* 排行榜按鈕 */}
            <IconButton
              onClick={() => setShowResultPopup(true)}
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.4)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                '&:active': { transform: 'scale(0.9)' },
                transition: 'all 0.2s',
              }}
            >
              <TrophyIcon sx={{ color: '#3b82f6' }} />
            </IconButton>

            {/* 聊天室按鈕 - 只有在有 groupId 時顯示 */}
            {event?.groupId && (
              <IconButton
                onClick={() => setChatPopupOpen(true)}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                  '&:active': { transform: 'scale(0.9)' },
                  transition: 'all 0.2s',
                }}
              >
                <MessageCircle size={20} style={{ color: '#3b82f6' }} />
              </IconButton>
            )}
          </Box>
      </Box>

      {/* 底部成員抽屜 */}
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        bgcolor: 'white',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -20px 50px rgba(0,0,0,0.1)',
        transition: 'height 0.5s ease-out',
        height: isDrawerOpen ? '75%' : 120,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 抽屜手柄 */}
        <Box 
          onClick={() => setDrawerOpen(!isDrawerOpen)} 
          sx={{ 
            width: '100%', 
            py: 1.5,
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Box sx={{ width: 48, height: 4, bgcolor: '#e2e8f0', borderRadius: 2 }} />
        </Box>

        {/* 抽屜標題區 */}
        <Box sx={{ 
          px: 3, 
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            成員列表
          </Typography>
          
          {/* 頭像預覽 */}
          <Box sx={{ display: 'flex', ml: 'auto' }}>
            {members.slice(0, 3).map((m, idx) => (
              <Box
                key={m.id}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '2px solid white',
                  bgcolor: m.arrivalTime ? '#22c55e' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: m.arrivalTime ? 'white' : '#64748b',
                  ml: idx > 0 ? -1.5 : 0,
                }}
              >
                {m.nickname?.charAt(0)?.toUpperCase() || '?'}
              </Box>
            ))}
            {members.length > 3 && (
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid white',
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#94a3b8',
                ml: -1.5,
              }}>
                +{members.length - 3}
              </Box>
            )}
          </Box>
        </Box>

        {/* 成員列表（可滾動） */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, pb: 2 }}>
          {members.length === 0 ? (
            <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
              目前還沒有成員加入
            </Typography>
          ) : (
            members.map((member) => {
              const isCurrentUser = member.id === currentMemberId;
              const isOwner = event && member.userId === event.ownerId;
              const etaState = membersETA.get(member.id);
              const eta = etaState?.eta;
              const movementStarted = etaState?.movementStarted ?? true; // 預設顯示「前往中」

              return (
                <Box
                  key={member.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: member.arrivalTime ? '#dcfce7' : '#f1f5f9',
                    bgcolor: member.arrivalTime ? '#f0fdf4' : 'white',
                    mb: 1.5,
                  }}
                >
                  {/* 頭像 */}
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: member.arrivalTime ? '#22c55e' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: member.arrivalTime ? 'white' : '#64748b',
                    flexShrink: 0,
                  }}>
                    {member.nickname?.charAt(0)?.toUpperCase() || '?'}
                  </Box>

                  {/* 成員資訊 */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9375rem' }}>
                        {member.nickname}
                      </Typography>
                      {isOwner && (
                        <Chip
                          label="主揪"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            bgcolor: '#ff9800',
                            color: 'white',
                            fontWeight: 700,
                          }}
                        />
                      )}
                      {isCurrentUser && (
                        <Chip
                          label="你"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            bgcolor: '#3b82f6',
                            color: 'white',
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ 
                      fontSize: '0.625rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: '#94a3b8',
                    }}>
                      {member.arrivalTime 
                        ? `已到達 ${format(new Date(member.arrivalTime), 'HH:mm')}`
                        : !movementStarted
                          ? '等待出發...'
                          : eta 
                            ? `約 ${eta.duration} 抵達`
                            : '前往中...'
                      }
                    </Typography>
                  </Box>

                  {/* 戳人按鈕（只有已到達的用戶才能戳未到達且非自己的成員） */}
                  {hasArrived && !member.arrivalTime && !isCurrentUser && (
                    <IconButton
                      onClick={() => handlePokeMember(member.id)}
                      disabled={pokingMemberId === member.id}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: pokingMemberId === member.id ? '#f97316' : '#fef3c7',
                        color: pokingMemberId === member.id ? 'white' : '#f97316',
                        '&:hover': { bgcolor: '#fed7aa', color: '#ea580c' },
                        transition: 'all 0.2s',
                      }}
                    >
                      <PokeIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {/* 「我到了」按鈕（固定在抽屜底部） */}
        <Box sx={{ 
          p: 3, 
          pt: 2,
          borderTop: '1px solid #e2e8f0',
          bgcolor: 'white',
        }}>
          {!hasArrived && !isEventEnded ? (
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={!canMarkArrival || marking}
              onClick={handleMarkArrival}
              sx={{
                py: 2,
                borderRadius: 3,
                bgcolor: canMarkArrival ? '#2563eb' : '#94a3b8',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: canMarkArrival ? '0 8px 24px rgba(37, 99, 235, 0.4)' : 'none',
                border: '4px solid white',
                '&:hover': {
                  bgcolor: canMarkArrival ? '#1d4ed8' : '#94a3b8',
                },
                '&:active': { transform: 'scale(0.98)' },
                '&.Mui-disabled': {
                  bgcolor: '#94a3b8',
                  color: 'white',
                },
              }}
            >
              {marking ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : canMarkArrival ? (
                "我到了 🏁"
              ) : distanceToMeetingPoint !== null && distanceToMeetingPoint !== undefined ? (
                `距離 ${Math.round(distanceToMeetingPoint as number)}m`
              ) : (
                '等待位置資訊...'
              )}
            </Button>
          ) : hasArrived ? (
            <Box sx={{
              py: 2,
              px: 4,
              borderRadius: 3,
              bgcolor: '#22c55e',
              color: 'white',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '1rem',
            }}>
              ✓ 已到達
            </Box>
          ) : isEventEnded ? (
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => setShowResultPopup(true)}
              startIcon={<TrophyIcon />}
              sx={{
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                borderWidth: 2,
                '&:hover': { borderWidth: 2 },
              }}
            >
              查看排行榜結果
            </Button>
          ) : null}
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        sx={{ zIndex: 1300 }}
      />

      {/* EventResultPopup */}
      {id && (
        <EventResultPopup
          open={showResultPopup}
          onClose={() => setShowResultPopup(false)}
          eventId={Number(id)}
        />
      )}

      {/* 編輯活動 Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'visible', // 改為 visible 以確保 Autocomplete 建議列表可以顯示
              position: 'relative',
              zIndex: 1300, // 確保 Dialog 的 z-index 足夠高
            },
          }}
          sx={{
            '& .MuiBackdrop-root': {
              zIndex: 1300, // 確保 backdrop 的 z-index 也足夠高
            },
            // 確保 Google Places Autocomplete 建議列表的 z-index 高於 Dialog
            '& ~ .pac-container': {
              zIndex: '1400 !important', // Google Places Autocomplete 容器
            },
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 2,
            pt: 3,
            px: 3,
          }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.25rem' }}>
              編輯活動
            </Typography>
            <IconButton
              onClick={handleCloseEditDialog}
              size="small"
              sx={{ 
                color: '#94a3b8',
                width: 32,
                height: 32,
                bgcolor: '#f1f5f9',
                '&:hover': { bgcolor: '#e2e8f0' },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* 活動名稱 */}
              <TextField
                label="活動名稱"
                placeholder="例如：週五火鍋聚會"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                fullWidth
                required
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* 開始時間 */}
              <DateTimePicker
                label="開始時間"
                value={editFormData.startTime}
                onChange={(newValue) => {
                  if (newValue) {
                    setEditFormData({ ...editFormData, startTime: newValue });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    },
                  },
                }}
              />

              {/* 結束時間 */}
              <DateTimePicker
                label="結束時間"
                value={editFormData.endTime}
                onChange={(newValue) => {
                  if (newValue) {
                    setEditFormData({ ...editFormData, endTime: newValue });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    },
                  },
                }}
              />

              {/* 地點選擇 */}
              <TextField
                label="集合地點"
                placeholder="搜尋地點或地址..."
                value={editFormData.meetingPointName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // 當用戶輸入時，如果當前有座標數據，清除它們
                  // 這樣 Autocomplete 才能正常工作並顯示建議
                  if (editFormData.meetingPointLat !== null || editFormData.meetingPointLng !== null) {
                    setEditFormData({ 
                      ...editFormData, 
                      meetingPointName: newValue,
                      meetingPointLat: null,
                      meetingPointLng: null,
                      meetingPointAddress: '',
                    });
                  } else {
                    setEditFormData({ 
                      ...editFormData, 
                      meetingPointName: newValue,
                    });
                  }
                }}
                inputRef={autocompleteInputRef}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                    </Box>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
                helperText={
                  editFormData.meetingPointLat && editFormData.meetingPointLng
                    ? `✓ 已選擇：${editFormData.meetingPointAddress || editFormData.meetingPointName}`
                    : '開始輸入以搜尋地點（使用 Google Places）'
                }
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button 
              onClick={handleCloseEditDialog} 
              disabled={updating}
              sx={{
                fontWeight: 600,
                color: '#64748b',
                '&:hover': {
                  bgcolor: '#f1f5f9',
                },
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateEvent}
              variant="contained"
              disabled={updating}
              startIcon={updating ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckIcon />}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                bgcolor: '#3b82f6',
                '&:hover': {
                  bgcolor: '#2563eb',
                },
                '&.Mui-disabled': {
                  bgcolor: '#94a3b8',
                },
              }}
            >
              {updating ? '更新中...' : '儲存'}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>

      {/* 邀請好友 Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={handleCloseInviteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '1.5rem',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            fontSize: '1.25rem',
            pb: 1,
          }}
        >
          邀請好友
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {loadingFriends ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : friends.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                沒有可邀請的好友
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {friends.map((friend, index) => (
                <Box key={friend.userId}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2.5,
                      px: 3,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#f8fafc',
                      },
                    }}
                    onClick={() => handleToggleFriendSelection(friend.userId)}
                  >
                    <Checkbox
                      checked={selectedFriends.includes(friend.userId)}
                      onChange={() => handleToggleFriendSelection(friend.userId)}
                      sx={{
                        color: '#3b82f6',
                        '&.Mui-checked': {
                          color: '#3b82f6',
                        },
                      }}
                    />
                    <Avatar
                      src={friend.avatar || undefined}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: '#dbeafe',
                        fontSize: '0.875rem',
                        borderRadius: 3,
                        color: '#2563eb',
                        fontWeight: 700,
                      }}
                    >
                      {friend.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: '#0f172a',
                          fontSize: '0.875rem',
                        }}
                      >
                        {friend.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {friend.email}
                      </Typography>
                    </Box>
                  </Box>
                  {index < friends.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={handleCloseInviteDialog}
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
            onClick={handleSendInvitations}
            variant="contained"
            disabled={selectedFriends.length === 0 || inviting}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            {inviting ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              `發送邀請 (${selectedFriends.length})`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 退出活動確認 Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={handleCloseLeaveDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '1.5rem',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            fontSize: '1.25rem',
            pb: 1,
          }}
        >
          退出活動
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
            確定要退出此活動嗎？退出後將無法查看活動詳情和成員位置。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={handleCloseLeaveDialog}
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
            onClick={handleLeaveEvent}
            variant="contained"
            disabled={leaving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' },
            }}
          >
            {leaving ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              '確定退出'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Popup */}
      {event && event.groupId !== null && event.groupId !== undefined && (
        <ChatPopup
          open={chatPopupOpen}
          onClose={() => setChatPopupOpen(false)}
          groupId={event.groupId as number}
          groupName={event.name}
        />
      )}
    </Box>
  );
}
