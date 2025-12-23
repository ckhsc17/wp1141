// Mock Data for Events Feature Development
// 對應 EVENTS_API_SPEC.md 的資料結構

import type {
  Event,
  EventMember,
  EventResult,
  MyEventItem,
  UserStats,
  GetEventResponse,
  GetEventResultResponse,
  GetMyEventsResponse,
  GetUserStatsResponse,
  CreateEventResponse,
  JoinEventResponse,
} from '../types/events';

// ============================================
// Mock Events
// ============================================

export const mockEvent1: Event = {
  id: 1,
  name: '週五火鍋聚會',
  ownerName: 'user123',
  startTime: '2025-12-06T19:00:00+08:00',
  endTime: '2025-12-06T21:00:00+08:00',
  meetingPointLat: 25.033,
  meetingPointLng: 121.565,
  meetingPointName: '台北101',
  meetingPointAddress: '台北市信義區信義路五段7號',
  status: 'ongoing',
  useMeetHalf: false,
  groupId: undefined,
  createdAt: '2025-11-29T10:00:00Z',
  updatedAt: '2025-11-29T10:00:00Z',
};

export const mockEvent2: Event = {
  id: 2,
  name: '週日電影',
  ownerName: 'user123',
  startTime: '2025-12-08T14:00:00+08:00',
  endTime: '2025-12-08T17:00:00+08:00',
  meetingPointLat: 25.042,
  meetingPointLng: 121.517,
  meetingPointName: '台北車站',
  meetingPointAddress: '台北市中正區北平西路3號',
  status: 'upcoming',
  useMeetHalf: false,
  groupId: undefined,
  createdAt: '2025-11-29T11:00:00Z',
  updatedAt: '2025-11-29T11:00:00Z',
};

export const mockEvent3: Event = {
  id: 3,
  name: '昨天的午餐聚會',
  ownerName: 'user456',
  startTime: '2025-11-28T12:00:00+08:00',
  endTime: '2025-11-28T14:00:00+08:00',
  meetingPointLat: 25.047,
  meetingPointLng: 121.517,
  meetingPointName: '信義商圈',
  meetingPointAddress: undefined,
  status: 'ended',
  useMeetHalf: false,
  groupId: undefined,
  createdAt: '2025-11-28T08:00:00Z',
  updatedAt: '2025-11-28T13:00:00Z',
};

// ============================================
// Mock Members
// ============================================

export const mockMembers: EventMember[] = [
  {
    id: 1,
    eventId: 1,
    userId: '1',
    nickname: '小明',
    shareLocation: true,
    lat: 25.040,
    lng: 121.560,
    address: undefined,
    arrivalTime: '2025-12-06T18:55:00Z',
    travelMode: 'transit',
    createdAt: '2025-11-29T10:05:00Z',
    updatedAt: '2025-12-06T18:55:30Z',
  },
  {
    id: 2,
    eventId: 1,
    userId: '2',
    nickname: '小華',
    shareLocation: true,
    lat: 25.045,
    lng: 121.555,
    address: undefined,
    arrivalTime: '2025-12-06T18:58:00Z',
    travelMode: 'driving',
    createdAt: '2025-11-29T10:10:00Z',
    updatedAt: '2025-12-06T18:58:20Z',
  },
  {
    id: 3,
    eventId: 1,
    userId: 'guest_abc123',
    nickname: '訪客小美',
    shareLocation: true,
    lat: 25.035,
    lng: 121.570,
    address: undefined,
    arrivalTime: '2025-12-06T19:05:00Z',
    travelMode: 'walking',
    createdAt: '2025-12-06T18:30:00Z',
    updatedAt: '2025-12-06T19:05:15Z',
  },
  {
    id: 4,
    eventId: 1,
    userId: '4',
    nickname: '小王',
    shareLocation: true,
    lat: 25.050,
    lng: 121.545,
    address: undefined,
    arrivalTime: undefined,
    travelMode: 'bicycling',
    createdAt: '2025-11-29T10:15:00Z',
    updatedAt: '2025-12-06T19:10:45Z',
  },
  {
    id: 5,
    eventId: 1,
    userId: 'guest_xyz789',
    nickname: '訪客小李',
    shareLocation: false,
    lat: undefined,
    lng: undefined,
    address: undefined,
    arrivalTime: undefined,
    travelMode: 'transit',
    createdAt: '2025-12-06T18:45:00Z',
    updatedAt: '2025-12-06T18:45:00Z',
  },
];

// ============================================
// Mock Event Result (排行榜)
// ============================================

// 完整的測試數據 - 包含前三名、遲到、缺席等各種場景
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

// ============================================
// Mock My Events List
// ============================================

export const mockMyEvents: MyEventItem[] = [
  {
    id: 1,
    name: '週五火鍋聚會',
    startTime: '2025-12-06T19:00:00+08:00',
    endTime: '2025-12-06T21:00:00+08:00',
    status: 'ongoing',
    memberCount: 5,
  },
  {
    id: 2,
    name: '週日電影',
    startTime: '2025-12-08T14:00:00+08:00',
    endTime: '2025-12-08T17:00:00+08:00',
    status: 'upcoming',
    memberCount: 3,
  },
  {
    id: 3,
    name: '昨天的午餐聚會',
    startTime: '2025-11-28T12:00:00+08:00',
    endTime: '2025-11-28T14:00:00+08:00',
    status: 'ended',
    memberCount: 6,
    myStatus: 'ontime',
    myRank: 2,
  },
  {
    id: 4,
    name: '上週晚餐',
    startTime: '2025-11-22T18:30:00+08:00',
    endTime: '2025-11-22T20:30:00+08:00',
    status: 'ended',
    memberCount: 4,
    myStatus: 'early',
    myRank: 1,
  },
  {
    id: 5,
    name: '咖啡時光',
    startTime: '2025-11-20T15:00:00+08:00',
    endTime: '2025-11-20T17:00:00+08:00',
    status: 'ended',
    memberCount: 3,
    myStatus: 'late',
    myRank: 3,
  },
];

// ============================================
// Mock User Stats
// ============================================

export const mockUserStats: UserStats = {
  totalEvents: 15,
  ontimeCount: 12,
  lateCount: 3,
  absentCount: 0,
  avgLateMinutes: 5.2,
  totalPokeReceived: 2,
  totalPokeSent: 8,
  ontimeRate: 0.80,
  bestRank: 1,
  worstRank: 10,
};

// ============================================
// Mock API Responses
// ============================================

export const mockGetEventResponse: GetEventResponse = {
  event: {
    ...mockEvent1,
    members: mockMembers,
  },
};

export const mockGetEventResultResponse: GetEventResultResponse = {
  result: mockEventResult,
};

export const mockGetMyEventsResponse: GetMyEventsResponse = {
  events: mockMyEvents,
  total: mockMyEvents.length,
  hasMore: false,
};

export const mockGetUserStatsResponse: GetUserStatsResponse = {
  stats: mockUserStats,
};

export const mockCreateEventResponse: CreateEventResponse = {
  event: mockEvent1,
  shareUrl: `https://meethalf.app/events/${mockEvent1.id}`,
};

export const mockJoinEventResponse: JoinEventResponse = {
  member: mockMembers[2], // 訪客小美
  guestToken: 'mock_guest_token_abc123xyz789',
};

// ============================================
// Helper Functions
// ============================================

/**
 * 根據 eventId 取得 mock event
 * @param eventId - 可以是 number 或 string（從 URL params 來的）
 */
export function getMockEventById(eventId: string | number): Event | undefined {
  const events = [mockEvent1, mockEvent2, mockEvent3];
  const numId = typeof eventId === 'string' ? parseInt(eventId, 10) : eventId;
  return events.find((e) => e.id === numId);
}

/**
 * 根據 eventId 取得 mock members
 * @param eventId - 可以是 number 或 string（從 URL params 來的）
 */
export function getMockMembersByEventId(eventId: string | number): EventMember[] {
  const numId = typeof eventId === 'string' ? parseInt(eventId, 10) : eventId;
  return mockMembers.filter((m) => m.eventId === numId);
}

/**
 * 模擬延遲（用於模擬 API 請求）
 */
export function mockDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 模擬成功回應
 */
export async function mockApiSuccess<T>(data: T, delay: number = 500): Promise<T> {
  await mockDelay(delay);
  return data;
}

/**
 * 模擬錯誤回應
 */
export async function mockApiError(
  code: string,
  message: string,
  delay: number = 500
): Promise<never> {
  await mockDelay(delay);
  throw {
    error: {
      code,
      message,
    },
  };
}

// ============================================
// Mock Data for Testing
// ============================================

/**
 * 生成隨機位置（台北範圍）
 */
export function generateRandomLocation(): { lat: number; lng: number } {
  const centerLat = 25.033;
  const centerLng = 121.565;
  const range = 0.05; // 約 5.5 公里範圍

  return {
    lat: centerLat + (Math.random() - 0.5) * range,
    lng: centerLng + (Math.random() - 0.5) * range,
  };
}

/**
 * 生成多個測試成員
 * @param count - 要生成的成員數量
 * @param eventId - 可以是 number 或 string（從 URL params 來的）
 */
export function generateMockMembers(count: number, eventId: string | number): EventMember[] {
  const names = ['小明', '小華', '小美', '小王', '小李', '小陳', '小張', '小林'];
  const travelModes: Array<'driving' | 'transit' | 'walking' | 'bicycling'> = [
    'driving',
    'transit',
    'walking',
    'bicycling',
  ];

  const numEventId = typeof eventId === 'string' ? parseInt(eventId, 10) : eventId;

  return Array.from({ length: count }, (_, index) => {
    const isGuest = index % 2 === 0;
    const hasLocation = Math.random() > 0.2; // 80% 有位置
    const hasArrived = Math.random() > 0.4; // 60% 已到達
    const location = hasLocation ? generateRandomLocation() : { lat: undefined, lng: undefined };

    return {
      id: index + 1,
      eventId: numEventId,
      userId: isGuest ? `guest_${index + 1}` : `${index + 1}`,
      nickname: isGuest ? `訪客${names[index % names.length]}` : names[index % names.length],
      shareLocation: hasLocation,
      lat: location.lat,
      lng: location.lng,
      address: undefined,
      arrivalTime: hasArrived ? new Date(Date.now() - Math.random() * 1800000).toISOString() : undefined,
      travelMode: travelModes[index % travelModes.length],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

// ============================================
// Export All
// ============================================

export default {
  events: [mockEvent1, mockEvent2, mockEvent3],
  members: mockMembers,
  eventResult: mockEventResult,
  myEvents: mockMyEvents,
  userStats: mockUserStats,
  
  // API responses
  responses: {
    getEvent: mockGetEventResponse,
    getEventResult: mockGetEventResultResponse,
    getMyEvents: mockGetMyEventsResponse,
    getUserStats: mockGetUserStatsResponse,
    createEvent: mockCreateEventResponse,
    joinEvent: mockJoinEventResponse,
  },
  
  // Helpers
  helpers: {
    getMockEventById,
    getMockMembersByEventId,
    mockDelay,
    mockApiSuccess,
    mockApiError,
    generateRandomLocation,
    generateMockMembers,
  },
};

