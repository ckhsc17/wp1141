/**
 * Device Detection Utility
 * 
 * 遵循 Clean Architecture 原則的設備檢測工具
 * - 單一職責：只負責檢測設備類型
 * - 無依賴：純函數，不依賴外部狀態
 * - 可測試：易於單元測試
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  userAgent: string;
}

export interface IDeviceDetector {
  getDeviceInfo(): DeviceInfo;
  isMobileDevice(): boolean;
  isTouchDevice(): boolean;
}

/**
 * 設備檢測器實現
 * 使用多種方法來準確檢測設備類型
 */
export class DeviceDetector implements IDeviceDetector {
  private static instance: DeviceDetector;
  
  public static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector();
    }
    return DeviceDetector.instance;
  }

  private constructor() {}

  /**
   * 獲取完整的設備信息
   */
  getDeviceInfo(): DeviceInfo {
    const userAgent = this.getUserAgent();
    const screenWidth = this.getScreenWidth();
    const isTouchDevice = this.detectTouchSupport();
    const isMobile = this.detectMobile(userAgent, screenWidth);
    const isTablet = this.detectTablet(userAgent, screenWidth);

    return {
      isMobile,
      isTablet,
      isTouchDevice,
      screenWidth,
      userAgent,
    };
  }

  /**
   * 檢測是否為移動設備（手機或平板）
   */
  isMobileDevice(): boolean {
    const deviceInfo = this.getDeviceInfo();
    return deviceInfo.isMobile || deviceInfo.isTablet;
  }

  /**
   * 檢測是否支持觸控
   */
  isTouchDevice(): boolean {
    return this.detectTouchSupport();
  }

  // ==================== Private Methods ====================

  private getUserAgent(): string {
    if (typeof window === 'undefined') return '';
    return window.navigator.userAgent;
  }

  private getScreenWidth(): number {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  }

  private detectTouchSupport(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - for older browsers
      navigator.msMaxTouchPoints > 0
    );
  }

  private detectMobile(userAgent: string, screenWidth: number): boolean {
    // User Agent 檢測
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);
    
    // 螢幕寬度檢測（手機通常小於 768px）
    const isMobileScreen = screenWidth > 0 && screenWidth < 768;
    
    return isMobileUA || isMobileScreen;
  }

  private detectTablet(userAgent: string, screenWidth: number): boolean {
    // iPad 檢測
    const isIPad = /iPad/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Android 平板檢測
    const isAndroidTablet = /Android/.test(userAgent) && !/Mobile/.test(userAgent);
    
    // 螢幕寬度檢測（平板通常在 768px - 1024px 之間）
    const isTabletScreen = screenWidth >= 768 && screenWidth <= 1024;
    
    return isIPad || isAndroidTablet || (isTabletScreen && this.detectTouchSupport());
  }
}

// ==================== Hooks ====================

/**
 * React Hook for device detection
 * 提供響應式的設備檢測功能
 */
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(() => {
    // 初始化時的默認值（SSR 安全）
    return {
      isMobile: false,
      isTablet: false,
      isTouchDevice: false,
      screenWidth: 0,
      userAgent: '',
    };
  });

  React.useEffect(() => {
    const detector = DeviceDetector.getInstance();
    const updateDeviceInfo = () => {
      setDeviceInfo(detector.getDeviceInfo());
    };

    // 初始檢測
    updateDeviceInfo();

    // 監聽視窗大小變化
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return {
    ...deviceInfo,
    isMobileDevice: deviceInfo.isMobile || deviceInfo.isTablet,
  };
};

// 需要導入 React
import React from 'react';
