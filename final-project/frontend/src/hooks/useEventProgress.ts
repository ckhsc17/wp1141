import { useMemo, useState, useEffect } from 'react';
import type { Event } from '../api/events';

interface EventProgress {
  mode: 'upcoming' | 'ongoing' | 'ended';
  progress: number; // 0-1
  label: string;
  description: string;
  color: string;
}

/**
 * 計算聚會的進度條狀態
 * - upcoming: 距離開始的倒數
 * - ongoing: 從開始到結束的進度
 * - ended: 已結束
 */
export function useEventProgress(event: Event | null): EventProgress | null {
  const [now, setNow] = useState(new Date());

  // 每秒更新時間
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    // 如果 event 為 null，返回 null
    if (!event) return null;

    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const currentTime = now.getTime();

    // 已結束
    if (currentTime > endTime.getTime()) {
      return {
        mode: 'ended',
        progress: 1,
        label: '聚會已結束',
        description: '',
        color: '#bdbdbd',
      };
    }

    // 進行中
    if (currentTime >= startTime.getTime()) {
      const total = endTime.getTime() - startTime.getTime();
      const elapsed = currentTime - startTime.getTime();
      const progress = Math.min(elapsed / total, 1);

      // 計算已開始和剩餘時間
      const elapsedMinutes = Math.floor(elapsed / 60000);
      const remainingMs = endTime.getTime() - currentTime;
      const remainingHours = Math.floor(remainingMs / 3600000);
      const remainingMinutes = Math.floor((remainingMs % 3600000) / 60000);

      let description = '';
      if (elapsedMinutes < 60) {
        description = `已開始 ${elapsedMinutes} 分鐘`;
      } else {
        const elapsedHours = Math.floor(elapsedMinutes / 60);
        description = `已開始 ${elapsedHours} 小時`;
      }

      if (remainingHours > 0) {
        description += `，距離結束還有 ${remainingHours} 小時`;
      } else if (remainingMinutes > 0) {
        description += `，距離結束還有 ${remainingMinutes} 分鐘`;
      }

      return {
        mode: 'ongoing',
        progress,
        label: '距離結束',
        description,
        color: '#ff9800', // Amber
      };
    }

    // 即將開始
    const remaining = startTime.getTime() - currentTime;
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);

    let description = '還有 ';
    if (days > 0) {
      description += `${days} 天 ${hours} 小時`;
    } else if (hours > 0) {
      description += `${hours} 小時 ${minutes} 分鐘`;
    } else if (minutes > 0) {
      description += `${minutes} 分鐘`;
    } else {
      const seconds = Math.floor((remaining % 60000) / 1000);
      description += `${seconds} 秒`;
    }

    // 進度：以 7 天前為起點，開始時間為終點
    // 如果聚會超過 7 天後，進度從 0 開始慢慢增長
    const sevenDaysAgo = startTime.getTime() - 7 * 86400000;
    const progressStart = Math.min(sevenDaysAgo, currentTime);
    const progressTotal = startTime.getTime() - progressStart;
    const progressElapsed = currentTime - progressStart;
    const progress = progressTotal > 0 ? Math.min(progressElapsed / progressTotal, 1) : 0;

    return {
      mode: 'upcoming',
      progress: Math.max(progress, 0.05), // 至少顯示一點進度
      label: '距離開始',
      description,
      color: '#2196f3', // Blue
    };
  }, [event, now]);
}

