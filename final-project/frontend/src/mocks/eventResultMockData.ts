/**
 * EventResult Mock Data for Testing
 * 
 * 使用方式：
 * 1. 在 EventResultPopup.tsx 中取消註解 import 和 USE_MOCK_DATA 相關代碼
 * 2. 切換不同的 mock data 來測試不同場景
 */

import type { EventResult } from '../types/events';

// 完整版測試數據 - 包含前三名、遲到、缺席等各種場景
export const mockEventResult: EventResult = {
  eventId: 1,
  rankings: [
    // 前三名
    {
      memberId: 1,
      nickname: '小明',
      arrivalTime: '2025-12-06T18:55:00Z',
      status: 'early',
      lateMinutes: 0,
      rank: 1,
      pokeCount: 0,
    },
    {
      memberId: 2,
      nickname: '小華',
      arrivalTime: '2025-12-06T18:58:00Z',
      status: 'ontime',
      lateMinutes: 0,
      rank: 2,
      pokeCount: 0,
    },
    {
      memberId: 3,
      nickname: '訪客小美',
      arrivalTime: '2025-12-06T19:05:00Z',
      status: 'late',
      lateMinutes: 5,
      rank: 3,
      pokeCount: 2,
    },
    // 遲到的人
    {
      memberId: 4,
      nickname: '小王',
      arrivalTime: '2025-12-06T19:15:00Z',
      status: 'late',
      lateMinutes: 15,
      rank: 4,
      pokeCount: 5,
    },
    {
      memberId: 6,
      nickname: '阿強',
      arrivalTime: '2025-12-06T19:20:00Z',
      status: 'late',
      lateMinutes: 20,
      rank: 5,
      pokeCount: 1,
    },
    {
      memberId: 7,
      nickname: '小雯',
      arrivalTime: '2025-12-06T19:25:00Z',
      status: 'late',
      lateMinutes: 25,
      rank: 6,
      pokeCount: 0,
    },
    // 缺席的人
    {
      memberId: 5,
      nickname: '訪客小李',
      status: 'absent',
      rank: 7,
      pokeCount: 3,
    },
    {
      memberId: 8,
      nickname: '大雄',
      status: 'absent',
      rank: 8,
      pokeCount: 7,
    },
  ],
  stats: {
    totalMembers: 8,
    arrivedCount: 6,
    lateCount: 4,
    absentCount: 2,
    avgArrivalTime: '2025-12-06T19:08:20Z',
    earliestArrival: {
      nickname: '小明',
      time: '2025-12-06T18:55:00Z',
    },
    latestArrival: {
      nickname: '小雯',
      time: '2025-12-06T19:25:00Z',
    },
    totalPokes: 18,
  },
  pokes: {
    mostPoked: {
      nickname: '大雄',
      count: 7,
    },
    mostPoker: {
      nickname: '小明',
      count: 5,
    },
  },
};

// 簡化版測試數據 - 只有前三名
export const mockEventResultSimple: EventResult = {
  eventId: 2,
  rankings: [
    {
      memberId: 1,
      nickname: '小明',
      arrivalTime: '2025-12-06T18:55:00Z',
      status: 'early',
      lateMinutes: 0,
      rank: 1,
      pokeCount: 0,
    },
    {
      memberId: 2,
      nickname: '小華',
      arrivalTime: '2025-12-06T18:58:00Z',
      status: 'ontime',
      lateMinutes: 0,
      rank: 2,
      pokeCount: 0,
    },
    {
      memberId: 3,
      nickname: '訪客小美',
      arrivalTime: '2025-12-06T19:00:00Z',
      status: 'ontime',
      lateMinutes: 0,
      rank: 3,
      pokeCount: 0,
    },
  ],
  stats: {
    totalMembers: 3,
    arrivedCount: 3,
    lateCount: 0,
    absentCount: 0,
    avgArrivalTime: '2025-12-06T18:57:40Z',
    earliestArrival: {
      nickname: '小明',
      time: '2025-12-06T18:55:00Z',
    },
    latestArrival: {
      nickname: '訪客小美',
      time: '2025-12-06T19:00:00Z',
    },
    totalPokes: 0,
  },
  pokes: {
    mostPoked: {
      nickname: '無',
      count: 0,
    },
    mostPoker: {
      nickname: '無',
      count: 0,
    },
  },
};

// 只有缺席的測試數據
export const mockEventResultAllAbsent: EventResult = {
  eventId: 3,
  rankings: [
    {
      memberId: 1,
      nickname: '小明',
      status: 'absent',
      rank: 1,
      pokeCount: 0,
    },
    {
      memberId: 2,
      nickname: '小華',
      status: 'absent',
      rank: 2,
      pokeCount: 0,
    },
    {
      memberId: 3,
      nickname: '訪客小美',
      status: 'absent',
      rank: 3,
      pokeCount: 0,
    },
  ],
  stats: {
    totalMembers: 3,
    arrivedCount: 0,
    lateCount: 0,
    absentCount: 3,
    totalPokes: 0,
  },
  pokes: {
    mostPoked: {
      nickname: '無',
      count: 0,
    },
    mostPoker: {
      nickname: '無',
      count: 0,
    },
  },
};

// 只有遲到的測試數據
export const mockEventResultAllLate: EventResult = {
  eventId: 4,
  rankings: [
    {
      memberId: 1,
      nickname: '小明',
      arrivalTime: '2025-12-06T19:10:00Z',
      status: 'late',
      lateMinutes: 10,
      rank: 1,
      pokeCount: 2,
    },
    {
      memberId: 2,
      nickname: '小華',
      arrivalTime: '2025-12-06T19:15:00Z',
      status: 'late',
      lateMinutes: 15,
      rank: 2,
      pokeCount: 3,
    },
    {
      memberId: 3,
      nickname: '訪客小美',
      arrivalTime: '2025-12-06T19:20:00Z',
      status: 'late',
      lateMinutes: 20,
      rank: 3,
      pokeCount: 1,
    },
  ],
  stats: {
    totalMembers: 3,
    arrivedCount: 3,
    lateCount: 3,
    absentCount: 0,
    avgArrivalTime: '2025-12-06T19:15:00Z',
    earliestArrival: {
      nickname: '小明',
      time: '2025-12-06T19:10:00Z',
    },
    latestArrival: {
      nickname: '訪客小美',
      time: '2025-12-06T19:20:00Z',
    },
    totalPokes: 6,
  },
  pokes: {
    mostPoked: {
      nickname: '小華',
      count: 3,
    },
    mostPoker: {
      nickname: '小明',
      count: 2,
    },
  },
};

