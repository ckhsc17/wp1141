// Google Analytics 設定
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Google Analytics gtag 函數
export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
};

// 頁面瀏覽追蹤
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID) return;
  
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// 事件追蹤介面
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// 統一事件追蹤函數
export const trackEvent = (event: AnalyticsEvent) => {
  // Google Analytics 事件追蹤
  if (GA_MEASUREMENT_ID) {
    gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }
  
  // 開發環境下輸出日誌
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', event);
  }
};

// 隱私權合規檢查
export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 檢查是否有設定同意狀態，預設為 true (可根據需求調整)
  const consent = localStorage.getItem('analytics-consent');
  return consent !== 'false'; // 只有明確拒絕才不追蹤
};

// 設定分析追蹤同意狀態
export const setAnalyticsConsent = (consent: boolean) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('analytics-consent', consent.toString());
  
  if (consent && GA_MEASUREMENT_ID) {
    // 重新初始化 GA
    gtag('config', GA_MEASUREMENT_ID);
  }
};

// 常用的追蹤事件函數
export const analytics = {
  // 按鈕點擊追蹤
  trackClick: (buttonName: string, location?: string) => {
    trackEvent({
      action: 'click',
      category: 'button',
      label: location ? `${buttonName}_${location}` : buttonName,
    });
  },

  // 檔案下載追蹤
  trackDownload: (fileName: string) => {
    trackEvent({
      action: 'download',
      category: 'file',
      label: fileName,
    });
  },

  // 外部連結點擊追蹤
  trackExternalLink: (linkName: string, url: string) => {
    trackEvent({
      action: 'click',
      category: 'external_link',
      label: linkName,
      value: 1,
    });
  },

  // 專案查看追蹤
  trackProjectView: (projectName: string) => {
    trackEvent({
      action: 'view',
      category: 'project',
      label: projectName,
    });
  },

  // 聯繫方式點擊追蹤
  trackContact: (contactMethod: string) => {
    trackEvent({
      action: 'contact',
      category: 'engagement',
      label: contactMethod,
    });
  },

  // 滾動深度追蹤
  trackScrollDepth: (depth: number) => {
    trackEvent({
      action: 'scroll',
      category: 'engagement',
      label: `${depth}%`,
      value: depth,
    });
  },

  // 頁面停留時間追蹤
  trackTimeOnPage: (timeInSeconds: number) => {
    trackEvent({
      action: 'time_on_page',
      category: 'engagement',
      value: timeInSeconds,
    });
  },
};

// 滾動深度追蹤實現
export const initScrollTracking = () => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  let maxDepth = 0;
  const milestones = [25, 50, 75, 100];
  const reached = new Set<number>();

  const handleScroll = () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    if (scrollPercent > maxDepth) {
      maxDepth = scrollPercent;

      // 檢查是否達到新的里程碑
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !reached.has(milestone)) {
          reached.add(milestone);
          analytics.trackScrollDepth(milestone);
        }
      });
    }
  };

  // 節流處理，避免過於頻繁的事件觸發
  let ticking = false;
  const throttledScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', throttledScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', throttledScroll);
  };
};

// 頁面載入時間追蹤
export const trackPageLoadTime = () => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  // 使用 Performance API 測量載入時間
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
        
        trackEvent({
          action: 'page_load_time',
          category: 'performance',
          value: loadTime,
        });
      }
    }, 0);
  });
};

// 分析工具初始化
export const initAnalytics = () => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  // 初始化滾動追蹤
  initScrollTracking();
  
  // 初始化頁面載入時間追蹤
  trackPageLoadTime();
  
  // 記錄頁面瀏覽
  pageview(window.location.pathname);
};

export default analytics;
