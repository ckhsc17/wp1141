/**
 * ETAService - 智能 ETA 計算服務
 * 
 * 核心策略：
 * 1. 非大眾運輸（driving/walking/bicycling）：頻繁重算，但有節流限制
 * 2. 大眾運輸（transit）：Base ETA + 倒數計時，每 10 分鐘或倒數到 0 時重算
 */

import { Client, TravelMode as GoogleTravelMode } from '@googlemaps/google-maps-services-js';
import { ETA_CONFIG, TravelMode, mapTravelModeToGoogle } from '../config/eta';
import { triggerEventChannel } from '../lib/pusher';

const gmapsClient = new Client({});
const GMAPS_KEY = process.env.GOOGLE_MAPS_SERVER_KEY || '';

/**
 * 成員 ETA 狀態
 */
interface MemberETAState {
  memberId: number;
  eventId: number;
  travelMode: TravelMode;
  
  // 位置追蹤
  initialLat: number | null;      // 首次位置（用於移動檢測）
  initialLng: number | null;
  lastLat: number | null;         // 上次計算 ETA 時的位置
  lastLng: number | null;
  
  // 移動狀態
  movementStarted: boolean;       // 是否已開始移動
  movementStartedAt: number | null; // 開始移動的 timestamp
  
  // ETA 計算
  lastETAComputedAt: number | null;  // 上次計算 ETA 的 timestamp
  
  // Transit 專用：Base ETA
  baseEtaSeconds: number | null;     // 出發時計算的 ETA（秒）
  baseEtaComputedAt: number | null;  // Base ETA 計算時間
  
  // 當前 ETA（緩存）
  currentEtaSeconds: number | null;
  currentEtaDistance: string | null;
  currentEtaDistanceValue: number | null;
}

/**
 * ETA 計算結果
 */
export interface ETAResult {
  memberId: number;
  etaSeconds: number | null;
  etaText: string | null;
  distance: string | null;
  distanceValue: number | null;
  movementStarted: boolean;
  isCountdown: boolean;  // 是否為倒數模式（transit）
}

/**
 * ETAService 單例
 */
class ETAService {
  private memberStates: Map<number, MemberETAState> = new Map();

  /**
   * 計算兩點距離（Haversine 公式）
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // 地球半徑（公尺）
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 格式化秒數為可讀文字
   */
  formatDuration(seconds: number): string {
    if (seconds <= 0) return '即將到達';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} 小時 ${minutes} 分鐘`;
    }
    return `${minutes} 分鐘`;
  }

  /**
   * 初始化或獲取成員狀態
   */
  private getOrCreateState(
    memberId: number,
    eventId: number,
    travelMode: TravelMode
  ): MemberETAState {
    let state = this.memberStates.get(memberId);
    
    if (!state) {
      state = {
        memberId,
        eventId,
        travelMode,
        initialLat: null,
        initialLng: null,
        lastLat: null,
        lastLng: null,
        movementStarted: false,
        movementStartedAt: null,
        lastETAComputedAt: null,
        baseEtaSeconds: null,
        baseEtaComputedAt: null,
        currentEtaSeconds: null,
        currentEtaDistance: null,
        currentEtaDistanceValue: null,
      };
      this.memberStates.set(memberId, state);
    }
    
    // 如果交通工具變更，重置狀態
    if (state.travelMode !== travelMode) {
      state.travelMode = travelMode;
      state.movementStarted = false;
      state.movementStartedAt = null;
      state.baseEtaSeconds = null;
      state.baseEtaComputedAt = null;
      state.lastETAComputedAt = null;
    }
    
    return state;
  }

  /**
   * 檢測是否開始移動
   */
  private detectMovementStart(
    state: MemberETAState,
    lat: number,
    lng: number
  ): boolean {
    // 如果已經開始移動，返回 true
    if (state.movementStarted) {
      return true;
    }

    // 如果沒有初始位置，記錄當前位置
    if (state.initialLat === null || state.initialLng === null) {
      state.initialLat = lat;
      state.initialLng = lng;
      return false;
    }

    // 計算與初始位置的距離
    const distance = this.calculateDistance(
      state.initialLat,
      state.initialLng,
      lat,
      lng
    );

    // 如果移動超過閾值，標記為開始移動
    if (distance >= ETA_CONFIG.MOVEMENT_THRESHOLD) {
      state.movementStarted = true;
      state.movementStartedAt = Date.now();
      return true;
    }

    return false;
  }

  /**
   * 檢查是否應該重新計算 ETA（非 Transit 模式的節流）
   */
  private shouldRecalculateETA(
    state: MemberETAState,
    lat: number,
    lng: number
  ): boolean {
    const now = Date.now();

    // 如果從未計算過，應該計算
    if (state.lastETAComputedAt === null) {
      return true;
    }

    // 檢查時間間隔
    const timeSinceLastCalc = now - state.lastETAComputedAt;
    if (timeSinceLastCalc < ETA_CONFIG.THROTTLE.MIN_INTERVAL_MS) {
      return false;
    }

    // 檢查位置變化
    if (state.lastLat !== null && state.lastLng !== null) {
      const distance = this.calculateDistance(
        state.lastLat,
        state.lastLng,
        lat,
        lng
      );
      if (distance < ETA_CONFIG.THROTTLE.MIN_DISTANCE_M) {
        return false;
      }
    }

    return true;
  }

  /**
   * 檢查 Transit 模式是否應該重新計算 Base ETA
   */
  private shouldRecalculateTransitBaseETA(state: MemberETAState): boolean {
    const now = Date.now();

    // 如果沒有 Base ETA，應該計算
    if (state.baseEtaSeconds === null || state.baseEtaComputedAt === null) {
      return true;
    }

    // 檢查是否已過 10 分鐘
    const timeSinceBaseCalc = now - state.baseEtaComputedAt;
    if (timeSinceBaseCalc >= ETA_CONFIG.TRANSIT.REFRESH_INTERVAL_MS) {
      return true;
    }

    // 檢查倒數是否已到 0（延誤情況）
    const elapsed = Math.floor((now - state.baseEtaComputedAt) / 1000);
    const currentEta = state.baseEtaSeconds - elapsed;
    if (currentEta <= 0) {
      return true;
    }

    return false;
  }

  /**
   * 調用 Google Distance Matrix API 計算 ETA
   */
  private async callDistanceMatrixAPI(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    travelMode: TravelMode
  ): Promise<{ durationSeconds: number; durationText: string; distance: string; distanceValue: number } | null> {
    try {
      const result = await gmapsClient.directions({
        params: {
          origin: `${originLat},${originLng}`,
          destination: `${destLat},${destLng}`,
          mode: mapTravelModeToGoogle(travelMode) as GoogleTravelMode,
          departure_time: Math.floor(Date.now() / 1000),
          key: GMAPS_KEY,
        },
      });

      if (result.data.status === 'OK' && result.data.routes.length > 0) {
        const route = result.data.routes[0];
        const leg = route.legs[0];
        console.log('[ETAService] ✓ Distance Matrix API success:', {
          travelMode,
          duration: leg.duration.text,
          distance: leg.distance.text,
        });
        return {
          durationSeconds: leg.duration.value,
          durationText: leg.duration.text,
          distance: leg.distance.text,
          distanceValue: leg.distance.value,
        };
      } else {
        console.warn('[ETAService] ⚠️ Distance Matrix API returned non-OK status:', {
          status: result.data.status,
          errorMessage: result.data.error_message,
          travelMode,
        });
      }
    } catch (error: any) {
      console.error('[ETAService] ✗ Error calling Distance Matrix API:', {
        error: error.message,
        travelMode,
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
      });
    }
    return null;
  }

  /**
   * 處理位置更新，計算 ETA
   */
  async handleLocationUpdate(
    memberId: number,
    eventId: number,
    lat: number,
    lng: number,
    travelMode: TravelMode,
    destLat: number,
    destLng: number,
    nickname: string
  ): Promise<ETAResult | null> {
    console.log('[ETAService] handleLocationUpdate called:', {
      memberId,
      eventId,
      lat,
      lng,
      travelMode,
      destLat,
      destLng,
      nickname,
    });

    const state = this.getOrCreateState(memberId, eventId, travelMode);

    // 檢測是否開始移動
    const hasStartedMoving = this.detectMovementStart(state, lat, lng);
    console.log('[ETAService] Movement detection result:', {
      memberId,
      hasStartedMoving,
      movementStarted: state.movementStarted,
      initialLat: state.initialLat,
      initialLng: state.initialLng,
    });

    // 如果尚未開始移動，返回 null
    if (!hasStartedMoving) {
      console.log('[ETAService] Member has not started moving yet, returning null ETA');
      return {
        memberId,
        etaSeconds: null,
        etaText: null,
        distance: null,
        distanceValue: null,
        movementStarted: false,
        isCountdown: false,
      };
    }

    let result: ETAResult;

    if (travelMode === 'transit') {
      // Transit 模式：Base ETA + 倒數
      console.log('[ETAService] Handling Transit ETA');
      result = await this.handleTransitETA(state, lat, lng, destLat, destLng);
    } else {
      // 其他模式：即時計算（有節流）
      console.log('[ETAService] Handling Real-time ETA');
      result = await this.handleRealTimeETA(state, lat, lng, destLat, destLng);
    }

    console.log('[ETAService] ETA calculation result:', {
      memberId,
      etaSeconds: result.etaSeconds,
      etaText: result.etaText,
      movementStarted: result.movementStarted,
      isCountdown: result.isCountdown,
    });

    // 廣播 ETA 更新到 Pusher
    if (result.etaSeconds !== null || result.movementStarted) {
      triggerEventChannel(eventId, 'eta-update', {
        memberId,
        nickname,
        eta: result.etaSeconds,
        etaText: result.etaText,
        distance: result.distance,
        distanceValue: result.distanceValue,
        movementStarted: result.movementStarted,
        isCountdown: result.isCountdown,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * 處理 Transit 模式的 ETA
   */
  private async handleTransitETA(
    state: MemberETAState,
    lat: number,
    lng: number,
    destLat: number,
    destLng: number
  ): Promise<ETAResult> {
    const now = Date.now();

    // 檢查是否需要重新計算 Base ETA
    if (this.shouldRecalculateTransitBaseETA(state)) {
      const apiResult = await this.callDistanceMatrixAPI(
        lat, lng, destLat, destLng, 'transit'
      );

      if (apiResult) {
        state.baseEtaSeconds = apiResult.durationSeconds;
        state.baseEtaComputedAt = now;
        state.lastETAComputedAt = now;
        state.lastLat = lat;
        state.lastLng = lng;
        state.currentEtaSeconds = apiResult.durationSeconds;
        state.currentEtaDistance = apiResult.distance;
        state.currentEtaDistanceValue = apiResult.distanceValue;

        return {
          memberId: state.memberId,
          etaSeconds: apiResult.durationSeconds,
          etaText: this.formatDuration(apiResult.durationSeconds),
          distance: apiResult.distance,
          distanceValue: apiResult.distanceValue,
          movementStarted: true,
          isCountdown: true,
        };
      }
    }

    // 使用倒數計算
    if (state.baseEtaSeconds !== null && state.baseEtaComputedAt !== null) {
      const elapsed = Math.floor((now - state.baseEtaComputedAt) / 1000);
      const currentEta = Math.max(0, state.baseEtaSeconds - elapsed);
      
      return {
        memberId: state.memberId,
        etaSeconds: currentEta,
        etaText: this.formatDuration(currentEta),
        distance: state.currentEtaDistance,
        distanceValue: state.currentEtaDistanceValue,
        movementStarted: true,
        isCountdown: true,
      };
    }

    // 無法計算
    return {
      memberId: state.memberId,
      etaSeconds: null,
      etaText: null,
      distance: null,
      distanceValue: null,
      movementStarted: true,
      isCountdown: true,
    };
  }

  /**
   * 處理即時 ETA（非 Transit 模式）
   */
  private async handleRealTimeETA(
    state: MemberETAState,
    lat: number,
    lng: number,
    destLat: number,
    destLng: number
  ): Promise<ETAResult> {
    // 檢查節流
    if (!this.shouldRecalculateETA(state, lat, lng)) {
      console.log('[ETAService] Using cached ETA (throttled):', {
        memberId: state.memberId,
        cachedETA: state.currentEtaSeconds,
      });
      // 返回緩存的 ETA
      return {
        memberId: state.memberId,
        etaSeconds: state.currentEtaSeconds,
        etaText: state.currentEtaSeconds !== null 
          ? this.formatDuration(state.currentEtaSeconds) 
          : null,
        distance: state.currentEtaDistance,
        distanceValue: state.currentEtaDistanceValue,
        movementStarted: true,
        isCountdown: false,
      };
    }

    console.log('[ETAService] Calculating new ETA:', {
      memberId: state.memberId,
      travelMode: state.travelMode,
      origin: `${lat},${lng}`,
      destination: `${destLat},${destLng}`,
    });

    // 調用 API 計算
    const apiResult = await this.callDistanceMatrixAPI(
      lat, lng, destLat, destLng, state.travelMode
    );

    if (apiResult) {
      state.lastETAComputedAt = Date.now();
      state.lastLat = lat;
      state.lastLng = lng;
      state.currentEtaSeconds = apiResult.durationSeconds;
      state.currentEtaDistance = apiResult.distance;
      state.currentEtaDistanceValue = apiResult.distanceValue;

      return {
        memberId: state.memberId,
        etaSeconds: apiResult.durationSeconds,
        etaText: this.formatDuration(apiResult.durationSeconds),
        distance: apiResult.distance,
        distanceValue: apiResult.distanceValue,
        movementStarted: true,
        isCountdown: false,
      };
    }

    // API 失敗，返回緩存
    console.warn('[ETAService] API call failed, returning cached ETA:', {
      memberId: state.memberId,
      cachedETA: state.currentEtaSeconds,
      hasCache: state.currentEtaSeconds !== null,
    });
    return {
      memberId: state.memberId,
      etaSeconds: state.currentEtaSeconds,
      etaText: state.currentEtaSeconds !== null 
        ? this.formatDuration(state.currentEtaSeconds) 
        : null,
      distance: state.currentEtaDistance,
      distanceValue: state.currentEtaDistanceValue,
      movementStarted: true,
      isCountdown: false,
    };
  }

  /**
   * 獲取成員當前 ETA（用於 GET API）
   */
  getMemberETA(memberId: number): ETAResult | null {
    const state = this.memberStates.get(memberId);
    
    if (!state) {
      return null;
    }

    // Transit 模式：計算倒數
    if (state.travelMode === 'transit' && state.baseEtaSeconds !== null && state.baseEtaComputedAt !== null) {
      const now = Date.now();
      const elapsed = Math.floor((now - state.baseEtaComputedAt) / 1000);
      const currentEta = Math.max(0, state.baseEtaSeconds - elapsed);

      return {
        memberId: state.memberId,
        etaSeconds: currentEta,
        etaText: this.formatDuration(currentEta),
        distance: state.currentEtaDistance,
        distanceValue: state.currentEtaDistanceValue,
        movementStarted: state.movementStarted,
        isCountdown: true,
      };
    }

    // 其他模式：返回緩存
    return {
      memberId: state.memberId,
      etaSeconds: state.currentEtaSeconds,
      etaText: state.currentEtaSeconds !== null 
        ? this.formatDuration(state.currentEtaSeconds) 
        : null,
      distance: state.currentEtaDistance,
      distanceValue: state.currentEtaDistanceValue,
      movementStarted: state.movementStarted,
      isCountdown: false,
    };
  }

  /**
   * 清理成員狀態（成員到達或離開活動時調用）
   */
  clearMemberState(memberId: number): void {
    this.memberStates.delete(memberId);
  }

  /**
   * 清理活動的所有成員狀態
   */
  clearEventStates(eventId: number): void {
    for (const [memberId, state] of this.memberStates.entries()) {
      if (state.eventId === eventId) {
        this.memberStates.delete(memberId);
      }
    }
  }
}

// 導出單例
export const etaService = new ETAService();

