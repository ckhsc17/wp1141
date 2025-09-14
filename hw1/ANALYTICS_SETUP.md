# 流量統計工具設置指南

本專案支援多種流量統計工具，提供完整的網站使用分析功能。

## 支援的分析工具

### 1. Google Analytics 4 (GA4) ⭐ 推薦
最完整的免費網站分析工具

**優點:**
- 免費且功能強大
- 詳細的用戶行為分析
- 實時數據監控
- 豐富的報告功能
- 與其他 Google 工具整合

### 2. Vercel Analytics 
適合 Vercel 部署的專案

**優點:**
- 與 Vercel 平台深度整合
- 簡單易用
- 注重隱私保護
- 速度分析功能

### 3. Plausible Analytics
注重隱私的輕量分析工具

**優點:**
- 不使用 Cookies
- 符合 GDPR 規範
- 輕量且快速
- 簡潔的介面

## 設置步驟

### 方案一：Google Analytics 4 (推薦)

#### 1. 建立 GA4 帳戶
1. 前往 [Google Analytics](https://analytics.google.com/)
2. 建立新的 Property
3. 選擇 "Web" 平台
4. 獲取 Measurement ID (格式: G-XXXXXXXXXX)

#### 2. 安裝依賴
```bash
npm install gtag
npm install --save-dev @types/gtag
```

#### 3. 設置環境變數
在 `.env.local` 檔案中添加：
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 4. 更新 analytics.ts
```typescript
// src/utils/analytics.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Google Analytics 追蹤函數
export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
};

// 頁面瀏覽追蹤
export const pageview = (url: string) => {
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// 事件追蹤
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
```

#### 5. 更新 layout.tsx
```typescript
// src/app/layout.tsx
import Script from 'next/script'
import { GA_MEASUREMENT_ID } from '@/utils/analytics'

// 在 <head> 中添加
{GA_MEASUREMENT_ID && (
  <>
    <Script
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
    />
    <Script
      id="google-analytics"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `,
      }}
    />
  </>
)}
```

### 方案二：Vercel Analytics

#### 1. 安裝依賴
```bash
npm install @vercel/analytics
```

#### 2. 在 Vercel Dashboard 開啟
1. 前往 Vercel 專案設置
2. 找到 "Analytics" 頁籤
3. 啟用 Analytics

#### 3. 更新 layout.tsx
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 方案三：同時使用多種工具

可以同時設置多種分析工具以獲得更全面的數據：

```typescript
// src/utils/analytics.ts
// 統一的分析事件接口
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// 統一的事件追蹤函數
export const trackEvent = (event: AnalyticsEvent) => {
  // Google Analytics
  if (GA_MEASUREMENT_ID) {
    gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }
  
  // 其他分析工具...
};
```

## 常用追蹤事件

### 用戶互動追蹤
```typescript
// 按鈕點擊
trackEvent({
  action: 'click',
  category: 'button',
  label: 'contact-email'
});

// 檔案下載
trackEvent({
  action: 'download',
  category: 'file',
  label: 'resume.pdf'
});

// 外部連結點擊
trackEvent({
  action: 'click',
  category: 'external_link',
  label: 'github'
});

// 專案查看
trackEvent({
  action: 'view',
  category: 'project',
  label: 'project-name'
});
```

### 滾動深度追蹤
```typescript
// 實現滾動深度追蹤
export const trackScrollDepth = () => {
  let maxDepth = 0;
  
  const handleScroll = () => {
    const depth = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    if (depth > maxDepth) {
      maxDepth = depth;
      
      // 每 25% 發送一次事件
      if (depth >= 25 && depth < 50 && maxDepth < 50) {
        trackEvent({ action: 'scroll', category: 'engagement', label: '25%' });
      } else if (depth >= 50 && depth < 75 && maxDepth < 75) {
        trackEvent({ action: 'scroll', category: 'engagement', label: '50%' });
      } else if (depth >= 75 && depth < 100 && maxDepth < 100) {
        trackEvent({ action: 'scroll', category: 'engagement', label: '75%' });
      } else if (depth >= 100) {
        trackEvent({ action: 'scroll', category: 'engagement', label: '100%' });
      }
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
};
```

## 隱私權考量

### GDPR 合規
- 添加 Cookie 同意橫幅
- 提供分析追蹤選擇退出功能
- 在隱私權政策中說明數據使用

### Cookie 同意實現
```typescript
// 簡單的 Cookie 同意檢查
export const hasAnalyticsConsent = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('analytics-consent') === 'true';
};

export const setAnalyticsConsent = (consent: boolean) => {
  localStorage.setItem('analytics-consent', consent.toString());
  
  if (consent && GA_MEASUREMENT_ID) {
    // 初始化 GA
    gtag('config', GA_MEASUREMENT_ID);
  }
};
```

## 效能優化

### 延遲載入
```typescript
// 延遲初始化分析工具
export const initAnalytics = () => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;
  
  // 延遲 2 秒載入以優化初始載入效能
  setTimeout(() => {
    if (GA_MEASUREMENT_ID) {
      gtag('config', GA_MEASUREMENT_ID);
    }
  }, 2000);
};
```

## 監控指標

### Core Web Vitals
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)  
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

### 自訂指標
- 頁面瀏覽時間
- 滾動深度
- 互動率
- 轉換率（如聯繫表單提交）

## 報告和洞察

### 關鍵報告
1. **流量來源分析**: 了解訪客來源
2. **頁面效能**: 各頁面瀏覽數和停留時間
3. **裝置分析**: 桌機 vs 手機使用情況
4. **地理位置**: 訪客地區分佈
5. **用戶行為流程**: 使用者在網站的瀏覽路徑

### 數據驅動優化
- 根據熱門頁面優化內容
- 分析離開頁面改善用戶體驗
- 根據裝置使用情況優化響應式設計
- 監控載入速度並持續優化

## 注意事項

1. **法律合規**: 確保符合當地隱私權法規
2. **效能影響**: 監控分析工具對網站效能的影響  
3. **數據準確性**: 定期檢查追蹤設定的正確性
4. **隱私保護**: 不收集個人敏感資訊
5. **備份方案**: 設置多種分析工具以避免數據遺失

---

選擇適合的分析工具並正確設置，可以幫助你更好地了解網站表現和用戶行為，從而持續改善用戶體驗。
