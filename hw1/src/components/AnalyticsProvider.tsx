'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, pageview } from '@/utils/analytics';

export default function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // 初始化分析工具
    initAnalytics();
  }, []);

  useEffect(() => {
    // 路由變更時追蹤頁面瀏覽
    if (pathname) {
      pageview(pathname);
    }
  }, [pathname]);

  return null;
}
