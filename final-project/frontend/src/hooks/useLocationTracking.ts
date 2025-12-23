import { useEffect, useRef } from 'react';
import { eventsApi } from '../api/events';
import { LOCATION_CONFIG } from '../config/location';

interface UseLocationTrackingOptions {
  enabled: boolean;
  eventId: number;
  shareLocation: boolean;
  hasJoined: boolean;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  onError?: (error: Error) => void;
  onLocationUpdate?: (lat: number, lng: number) => void; // 立即更新本地状态的回调
}

/**
 * Hook for tracking user location and updating it to the backend
 * Uses navigator.geolocation.watchPosition for continuous tracking
 */
export function useLocationTracking({
  enabled,
  eventId,
  shareLocation,
  hasJoined,
  startTime,
  endTime,
  onError,
  onLocationUpdate,
}: UseLocationTrackingOptions) {
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    // Check if tracking should be enabled
    if (!enabled || !shareLocation || !hasJoined) {
      // Clean up if disabled
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser');
      console.error('[useLocationTracking]', error);
      onError?.(error);
      return;
    }

    // Check if within time window (startTime - 30min to endTime + 30min)
    // 在開發模式下，放寬時間窗限制：允許在活動開始前的任何時間開始追蹤
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    let windowStart: Date;
    let windowEnd: Date;
    
    if (isDevelopment) {
      // 開發模式：允許在活動開始前的任何時間開始追蹤，直到活動結束後 30 分鐘
      windowStart = new Date(0); // 1970-01-01，表示任何時間都可以
      windowEnd = new Date(end.getTime() + LOCATION_CONFIG.TIME_WINDOW_AFTER);
    } else {
      // 生產模式：只在活動開始前 30 分鐘到結束後 30 分鐘內追蹤
      windowStart = new Date(start.getTime() - LOCATION_CONFIG.TIME_WINDOW_BEFORE);
      windowEnd = new Date(end.getTime() + LOCATION_CONFIG.TIME_WINDOW_AFTER);
    }

    // 只在開發模式且首次檢查時記錄，避免過多日誌
    if (isDevelopment && !watchIdRef.current) {
      console.log('[useLocationTracking] Time window check', {
        now: now.toISOString(),
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        isWithinWindow: now >= windowStart && now <= windowEnd,
        isDevelopment,
        eventStart: start.toISOString(),
        eventEnd: end.toISOString(),
      });
    }

    // 檢查是否在時間窗內（開發模式下，只要不超過活動結束後 30 分鐘即可）
    if (now > windowEnd) {
      console.log('[useLocationTracking] Event has ended, skipping location tracking', {
        now: now.toISOString(),
        windowEnd: windowEnd.toISOString(),
        isDevelopment,
      });
      return;
    }
    
    // 開發模式下，不檢查 windowStart（允許任何時間開始）
    // 生產模式下，檢查是否在 windowStart 之前
    if (!isDevelopment && now < windowStart) {
      console.log('[useLocationTracking] Before time window, skipping location tracking', {
        now: now.toISOString(),
        windowStart: windowStart.toISOString(),
        isDevelopment,
      });
      return;
    }

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();

        // Throttle updates to avoid too frequent API calls
        if (now - lastUpdateTimeRef.current < LOCATION_CONFIG.UPDATE_INTERVAL) {
          return;
        }

        lastUpdateTimeRef.current = now;

        // 立即更新本地状态，让地图立即显示位置
        if (onLocationUpdate) {
          onLocationUpdate(latitude, longitude);
        }

        try {
          await eventsApi.updateLocation(eventId, {
            lat: latitude,
            lng: longitude,
          });
        } catch (error: any) {
          // 只在開發模式或非 400 錯誤時記錄詳細錯誤
          const isValidationError = error?.response?.status === 400;
          if (!isValidationError || import.meta.env.DEV) {
            console.error('[useLocationTracking] Failed to update location:', {
              error,
              status: error?.response?.status,
              message: error?.response?.data?.message || error?.message,
              eventId,
              lat: latitude,
              lng: longitude,
            });
          }
          onError?.(error instanceof Error ? error : new Error('Failed to update location'));
        }
      },
      (error) => {
        console.error('[useLocationTracking] Geolocation error:', error);
        onError?.(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: LOCATION_CONFIG.HIGH_ACCURACY,
        timeout: LOCATION_CONFIG.TIMEOUT,
        maximumAge: LOCATION_CONFIG.MAXIMUM_AGE,
      }
    );

    watchIdRef.current = watchId;

    // Cleanup function
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, eventId, shareLocation, hasJoined, startTime, endTime, onError, onLocationUpdate]);
}

