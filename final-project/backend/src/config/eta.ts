/**
 * ETA 計算系統配置
 */
export const ETA_CONFIG = {
  // 移動檢測閾值（公尺）- 位置變化超過此值視為開始移動
  MOVEMENT_THRESHOLD: 100,

  // 非 Transit 模式的節流設定
  THROTTLE: {
    MIN_INTERVAL_MS: 30000,  // 最少 30 秒間隔
    MIN_DISTANCE_M: 50,      // 最少移動 50 公尺才重新計算
  },

  // Transit 專用設定
  TRANSIT: {
    REFRESH_INTERVAL_MS: 10 * 60 * 1000,  // 每 10 分鐘重算 Base ETA
  },

  // 時間窗口（毫秒）- 只在此窗口內計算 ETA
  TIME_WINDOW: {
    BEFORE_START: 30 * 60 * 1000,  // 開始前 30 分鐘
    AFTER_END: 30 * 60 * 1000,     // 結束後 30 分鐘
  },
};

export type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling' | 'motorcycle';

/**
 * 將 TravelMode 映射到 Google Maps API 的 TravelMode
 * 機車使用 DRIVING 模式（Google Maps 沒有專門的機車模式）
 */
export function mapTravelModeToGoogle(travelMode: TravelMode): 'driving' | 'transit' | 'walking' | 'bicycling' {
  if (travelMode === 'motorcycle') {
    return 'driving';
  }
  return travelMode;
}

