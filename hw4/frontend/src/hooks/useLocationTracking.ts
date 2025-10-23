import { useState, useEffect, useCallback, useRef } from 'react';
import { MapLocation } from '@/types';

interface LocationTrackingOptions {
  // 定時更新間隔（毫秒）
  updateInterval?: number;
  // 觸發更新的最小距離（米）
  minDistanceThreshold?: number;
  // 是否啟用定時更新
  enablePeriodicUpdate?: boolean;
  // 是否啟用距離檢測
  enableDistanceTracking?: boolean;
  // 高精度定位
  enableHighAccuracy?: boolean;
  // 定位超時時間
  timeout?: number;
  // 快取時間
  maximumAge?: number;
}

interface LocationTrackingResult {
  currentLocation: MapLocation | null;
  lastLocation: MapLocation | null;
  isTracking: boolean;
  error: string | null;
  loading: boolean;
  distanceMoved: number;
  startTracking: () => void;
  stopTracking: () => void;
  forceUpdate: () => Promise<MapLocation | null>;
}

const DEFAULT_OPTIONS: Required<LocationTrackingOptions> = {
  updateInterval: 30000, // 30秒
  minDistanceThreshold: 50, // 50米
  enablePeriodicUpdate: true,
  enableDistanceTracking: true,
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000
};

// 計算兩點間距離（米）
const calculateDistance = (pos1: MapLocation, pos2: MapLocation): number => {
  const R = 6371e3; // 地球半徑（米）
  const φ1 = pos1.lat * Math.PI / 180;
  const φ2 = pos2.lat * Math.PI / 180;
  const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
  const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const useLocationTracking = (
  options: LocationTrackingOptions = {},
  onLocationUpdate?: (location: MapLocation, distanceMoved: number) => void
): LocationTrackingResult => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null);
  const [lastLocation, setLastLocation] = useState<MapLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [distanceMoved, setDistanceMoved] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastApiCallTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<boolean>(false);
  const currentLocationRef = useRef<MapLocation | null>(null);
  const onLocationUpdateRef = useRef(onLocationUpdate);

  // 更新 ref 值
  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  // 獲取當前位置
  const getCurrentPosition = useCallback((): Promise<MapLocation | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errorMsg = '瀏覽器不支援地理位置功能';
        setError(errorMsg);
        console.error(errorMsg);
        resolve(null);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: MapLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          console.log('獲取到新位置:', newLocation);
          setLoading(false);
          resolve(newLocation);
        },
        (error) => {
          let errorMessage: string;
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '用戶拒絕了位置權限請求';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置資訊不可用';
              break;
            case error.TIMEOUT:
              errorMessage = '位置請求超時';
              break;
            default:
              errorMessage = '獲取位置時發生未知錯誤';
              break;
          }
          
          console.error('獲取位置失敗:', errorMessage);
          setError(errorMessage);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge
        }
      );
    });
  }, [opts.enableHighAccuracy, opts.timeout, opts.maximumAge]);

  // 更新位置（帶性能優化）
  const updateLocation = useCallback(async (forceUpdate = false) => {
    const now = Date.now();
    
    // 避免過於頻繁的更新（除非強制更新）
    if (!forceUpdate && now - lastUpdateTimeRef.current < 5000) {
      return;
    }

    // 避免同時進行多個位置更新請求
    if (pendingUpdateRef.current && !forceUpdate) {
      console.log('位置更新請求進行中，跳過此次更新');
      return;
    }

    pendingUpdateRef.current = true;

    try {
      const newLocation = await getCurrentPosition();
      if (!newLocation) return;

      let distance = 0;
      let shouldUpdate = forceUpdate;
      let shouldTriggerCallback = false;

      if (currentLocationRef.current) {
        distance = calculateDistance(currentLocationRef.current, newLocation);
        setDistanceMoved(prev => prev + distance);
        
        // 檢查是否移動了足夠的距離
        if (opts.enableDistanceTracking && distance >= opts.minDistanceThreshold) {
          shouldUpdate = true;
          shouldTriggerCallback = true;
          console.log(`移動距離 ${distance.toFixed(2)}m 超過閾值 ${opts.minDistanceThreshold}m，觸發更新`);
        }
      } else {
        // 首次獲取位置
        shouldUpdate = true;
        shouldTriggerCallback = true;
      }

      if (shouldUpdate) {
        setLastLocation(currentLocationRef.current);
        setCurrentLocation(newLocation);
        lastUpdateTimeRef.current = now;
      }
      
      // 限制 API 調用頻率（最多每 10 秒一次）
      if (shouldTriggerCallback && onLocationUpdateRef.current) {
        const timeSinceLastApiCall = now - lastApiCallTimeRef.current;
        if (forceUpdate || timeSinceLastApiCall >= 10000) {
          lastApiCallTimeRef.current = now;
          onLocationUpdateRef.current(newLocation, distance);
        } else {
          console.log(`API 調用過於頻繁，跳過此次回調（距離上次 ${timeSinceLastApiCall}ms）`);
        }
      }
    } finally {
      pendingUpdateRef.current = false;
    }
  }, [getCurrentPosition, opts.enableDistanceTracking, opts.minDistanceThreshold]); // 移除 currentLocation 和 onLocationUpdate 依賴

  // 強制更新位置
  const forceUpdate = useCallback(async (): Promise<MapLocation | null> => {
    await updateLocation(true);
    return currentLocationRef.current;
  }, [updateLocation]);

  // 開始追蹤
  const startTracking = useCallback(() => {
    if (isTracking) return;

    console.log('開始位置追蹤', opts);
    setIsTracking(true);
    setError(null);
    setDistanceMoved(0);

    // 立即獲取一次位置
    updateLocation(true);

    // 設置定時更新
    if (opts.enablePeriodicUpdate && opts.updateInterval > 0) {
      intervalIdRef.current = setInterval(() => {
        updateLocation();
      }, opts.updateInterval);
    }

    // 設置持續監聽（用於距離檢測）
    if (opts.enableDistanceTracking && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: MapLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // 使用 ref 來避免依賴項問題
          if (currentLocationRef.current) {
            const distance = calculateDistance(currentLocationRef.current, newLocation);
            if (distance >= opts.minDistanceThreshold) {
              updateLocation();
            }
          }
        },
        (error) => {
          console.error('位置監聽錯誤:', error);
        },
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge
        }
      );
    }
  }, [isTracking]); // 只依賴 isTracking

  // 停止追蹤
  const stopTracking = useCallback(() => {
    if (!isTracking) return;

    console.log('停止位置追蹤');
    setIsTracking(false);

    // 清除定時器
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // 清除位置監聽
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [isTracking]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    currentLocation,
    lastLocation,
    isTracking,
    error,
    loading,
    distanceMoved,
    startTracking,
    stopTracking,
    forceUpdate
  };
};
