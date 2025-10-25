import { TreasureType, TreasureTypeConfig } from '@/types';

// 寶藏類型配置
export const TREASURE_TYPE_CONFIG: TreasureTypeConfig = {
  [TreasureType.MUSIC]: {
    label: '音樂',
    icon: '🎵',
    color: '#FF6B6B',
    description: '分享音樂相關內容'
  },
  [TreasureType.AUDIO]: {
    label: '錄音檔',
    icon: '🎙️',
    color: '#4ECDC4',
    description: '語音或錄音分享'
  },
  [TreasureType.TEXT]: {
    label: '文字',
    icon: '📝',
    color: '#45B7D1',
    description: '故事、詩歌、笑話等文字內容'
  },
  [TreasureType.LINK]: {
    label: '連結',
    icon: '🔗',
    color: '#96CEB4',
    description: '分享有趣的網路連結'
  },
  [TreasureType.LIVE_MOMENT]: {
    label: '活在當下',
    icon: '📍',
    color: '#FFCC28',
    description: '記錄當下此刻的美好'
  },
  [TreasureType.IMAGE]: {
    label: '圖片',
    icon: '🖼️',
    color: '#9B59B6',
    description: '分享圖片和照片'
  }
};

// API 端點
export const API_ENDPOINTS = {
  // 認證相關
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGIN_PASSWORD: '/api/auth/login-password',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    GOOGLE: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback'
  },
  // 寶藏相關
  TREASURES: {
    LIST: '/api/treasures',
    CREATE: '/api/treasures',
    DETAIL: (id: string) => `/api/treasures/${id}`,
    UPDATE: (id: string) => `/api/treasures/${id}`,
    DELETE: (id: string) => `/api/treasures/${id}`,
    LIKE: (id: string) => `/api/treasures/${id}/like`,
    FAVORITE: (id: string) => `/api/treasures/${id}/favorite`,
    COLLECT: '/api/treasures/collect'
  },
  // 用戶相關
  USERS: {
    PROFILE: '/api/users/profile',
    STATS: '/api/users/stats',
    TREASURES: '/api/users/treasures',
    FAVORITES: '/api/users/favorites',
    COLLECTS: '/api/users/collects',
    UPDATE_PROFILE: '/api/users/profile',
    UPLOAD_AVATAR: '/api/users/avatar',
    DELETE_ACCOUNT: '/api/users/profile',
    PUBLIC_PROFILE: (userId: string) => `/api/users/${userId}/profile`,
    PUBLIC_TREASURES: (userId: string) => `/api/users/${userId}/treasures`
  },
  // 媒體上傳相關
  MEDIA: {
    UPLOAD_IMAGE: '/api/media/upload/image',
    UPLOAD_AUDIO: '/api/media/upload/audio'
  },
  // 留言相關
  COMMENTS: {
    GET_BY_TREASURE_ID: (treasureId: string) => `/api/treasures/${treasureId}/comments`,
    CREATE: (treasureId: string) => `/api/treasures/${treasureId}/comments`,
    GET_BY_ID: (commentId: string) => `/api/comments/${commentId}`,
    UPDATE: (commentId: string) => `/api/comments/${commentId}`,
    DELETE: (commentId: string) => `/api/comments/${commentId}`
  },
  // 檔案上傳
  UPLOAD: '/api/upload',
  // 地理位置
  GEOCODING: {
    REVERSE: '/api/geocoding/reverse'
  }
};

// 應用設定
export const APP_CONFIG = {
  NAME: '尋寶地圖',
  DESCRIPTION: '在地圖上發現和分享生活中的美好寶藏',
  DEFAULT_MAP_CENTER: { lat: 25.033, lng: 121.5654 }, // 台北市中心
  DEFAULT_MAP_ZOOM: 12,
  LIVE_LOCATION_RADIUS: 20, // 「活在當下」功能的定位半徑（公尺）
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_AUDIO_FORMATS: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/gif'],
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  }
};

// 本地儲存鍵值
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'treasure_access_token',
  REFRESH_TOKEN: 'treasure_refresh_token',
  USER_DATA: 'treasure_user_data',
  MAP_CENTER: 'treasure_map_center',
  MAP_ZOOM: 'treasure_map_zoom',
  FILTERS: 'treasure_filters'
};

// 錯誤訊息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '網路連線異常，請檢查網路設定',
  LOCATION_DENIED: '無法取得位置權限，請在瀏覽器設定中允許位置存取',
  LOCATION_UNAVAILABLE: '無法取得位置資訊',
  LOCATION_TIMEOUT: '取得位置資訊逾時',
  FILE_TOO_LARGE: '檔案大小超過限制',
  UNSUPPORTED_FILE_FORMAT: '不支援的檔案格式',
  LOGIN_REQUIRED: '請先登入才能使用此功能',
  UNAUTHORIZED: '您沒有權限執行此操作',
  SERVER_ERROR: '伺服器異常，請稍後再試',
  VALIDATION_ERROR: '資料驗證失敗',
  TREASURE_NOT_FOUND: '找不到指定的寶藏',
  COMMENT_NOT_FOUND: '找不到指定的留言'
};

// 成功訊息
export const SUCCESS_MESSAGES = {
  TREASURE_CREATED: '寶藏創建成功！',
  TREASURE_UPDATED: '寶藏更新成功！',
  TREASURE_DELETED: '寶藏刪除成功！',
  COMMENT_CREATED: '留言發布成功！',
  COMMENT_UPDATED: '留言更新成功！',
  COMMENT_DELETED: '留言刪除成功！',
  LIKED: '已按讚！',
  UNLIKED: '已取消按讚！',
  FAVORITED: '已收藏！',
  UNFAVORITED: '已取消收藏！',
  LOGIN_SUCCESS: '登入成功！',
  LOGOUT_SUCCESS: '登出成功！'
};

// 地圖相關常數
export const MAP_CONFIG = {
  STYLES: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ],
  MARKER_ICONS: {
    [TreasureType.MUSIC]: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${TREASURE_TYPE_CONFIG[TreasureType.MUSIC].color}" stroke="white" stroke-width="2"/>
          <text x="16" y="22" text-anchor="middle" font-size="16">${TREASURE_TYPE_CONFIG[TreasureType.MUSIC].icon}</text>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 }
    },
    [TreasureType.AUDIO]: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${TREASURE_TYPE_CONFIG[TreasureType.AUDIO].color}" stroke="white" stroke-width="2"/>
          <text x="16" y="22" text-anchor="middle" font-size="16">${TREASURE_TYPE_CONFIG[TreasureType.AUDIO].icon}</text>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 }
    },
    [TreasureType.TEXT]: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${TREASURE_TYPE_CONFIG[TreasureType.TEXT].color}" stroke="white" stroke-width="2"/>
          <text x="16" y="22" text-anchor="middle" font-size="16">${TREASURE_TYPE_CONFIG[TreasureType.TEXT].icon}</text>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 }
    },
    [TreasureType.LINK]: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${TREASURE_TYPE_CONFIG[TreasureType.LINK].color}" stroke="white" stroke-width="2"/>
          <text x="16" y="22" text-anchor="middle" font-size="16">${TREASURE_TYPE_CONFIG[TreasureType.LINK].icon}</text>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 }
    },
    [TreasureType.LIVE_MOMENT]: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${TREASURE_TYPE_CONFIG[TreasureType.LIVE_MOMENT].color}" stroke="white" stroke-width="2"/>
          <text x="16" y="22" text-anchor="middle" font-size="16">${TREASURE_TYPE_CONFIG[TreasureType.LIVE_MOMENT].icon}</text>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 }
    },
    [TreasureType.IMAGE]: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${TREASURE_TYPE_CONFIG[TreasureType.IMAGE].color}" stroke="white" stroke-width="2"/>
          <text x="16" y="22" text-anchor="middle" font-size="16">${TREASURE_TYPE_CONFIG[TreasureType.IMAGE].icon}</text>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 }
    }
  }
};

// 顏色配置
export const COLORS = {
  // 改善的灰色文字顏色，提高對比度和可讀性
  TEXT: {
    PRIMARY: '#1a1a1a',      // 主要文字顏色
    SECONDARY: '#1a1a1a',    // 次要文字顏色（替代 dimmed）
    MUTED: '#6b6b6b',        // 輕微淡化的文字
    DISABLED: '#9ca3af'      // 禁用狀態文字
  },
  // 圖標顏色
  ICON: {
    DEFAULT: '#6b7280',      // 預設圖標顏色
    ACTIVE: '#374151',       // 活躍狀態圖標
    HEART: '#ef4444',        // 愛心紅色
    BOOKMARK: '#22c55e'      // 收藏綠色
  }
};

// 驗證規則
export const VALIDATION_RULES = {
  TREASURE: {
    TITLE: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 100
    },
    CONTENT: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 1000
    },
    TAGS: {
      MAX_COUNT: 10,
      MAX_LENGTH: 20
    }
  },
  COMMENT: {
    CONTENT: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 500
    }
  }
};