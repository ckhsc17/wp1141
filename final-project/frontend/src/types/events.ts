// Events API TypeScript Definitions
// 對應 EVENTS_API_SPEC.md

export type EventStatus = 'upcoming' | 'ongoing' | 'ended';
export type MemberStatus = 'early' | 'ontime' | 'late' | 'absent';
export type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling' | 'motorcycle';

/**
 * 聚會活動
 */
export interface Event {
  id: number;
  name: string;
  ownerName: string;
  startTime: string; // ISO 8601 - 聚會開始時間
  endTime: string;   // ISO 8601 - 聚會結束時間
  meetingPointLat?: number;
  meetingPointLng?: number;
  meetingPointName?: string;
  meetingPointAddress?: string;
  status: EventStatus;
  useMeetHalf: boolean;
  groupId?: number;
  createdAt: string;
  updatedAt: string;
  members?: EventMember[];
}

/**
 * 聚會成員
 */
export interface EventMember {
  id: number;
  userId?: string | null;  // User.userId 或 "guest_abc123"
  eventId: number;
  nickname?: string;
  lat?: number;
  lng?: number;
  address?: string;
  travelMode?: TravelMode;
  shareLocation: boolean;
  arrivalTime?: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

/**
 * 戳人記錄
 */
export interface PokeRecord {
  id: string;
  eventId: number;
  fromMemberId: number;
  toMemberId: number;
  createdAt: string;
}

/**
 * 排行榜項目
 */
export interface RankingItem {
  memberId: number;
  nickname: string;
  avatar?: string | null;
  arrivalTime?: string;
  status: MemberStatus;
  lateMinutes?: number;
  rank: number;
  pokeCount: number;
}

/**
 * 聚會統計
 */
export interface EventStats {
  totalMembers: number;
  arrivedCount: number;
  lateCount: number;
  absentCount: number;
  avgArrivalTime?: string;
  earliestArrival?: {
    nickname: string;
    time: string;
  };
  latestArrival?: {
    nickname: string;
    time: string;
  };
  totalPokes: number;
}

/**
 * 戳人統計
 */
export interface PokeStats {
  mostPoked: {
    nickname: string;
    count: number;
  };
  mostPoker: {
    nickname: string;
    count: number;
  };
}

/**
 * 聚會結果（排行榜）
 */
export interface EventResult {
  eventId: number;
  rankings: RankingItem[];
  stats: EventStats;
  pokes: PokeStats;
}

/**
 * 我的聚會列表項目
 */
export interface MyEventItem {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  memberCount: number;
  myStatus?: MemberStatus;
  myRank?: number;
}

/**
 * 個人統計
 */
export interface UserStats {
  totalEvents: number;
  ontimeCount: number;
  lateCount: number;
  absentCount: number;
  avgLateMinutes: number;
  totalPokeReceived: number;
  totalPokeSent: number;
  ontimeRate: number; // 0-1
  bestRank: number;
  worstRank: number;
}

/**
 * Pusher 事件: 位置更新
 */
export interface LocationUpdateEvent {
  memberId: number;
  nickname: string;
  lat: number;
  lng: number;
  timestamp: string;
}

/**
 * Pusher 事件: 成員加入
 */
export interface MemberJoinedEvent {
  memberId: number;
  nickname: string;
  userId?: string | null;
  shareLocation: boolean;
  travelMode?: TravelMode;
  createdAt: string;
}

/**
 * Pusher 事件: 成員到達
 */
export interface MemberArrivedEvent {
  memberId: number;
  nickname: string;
  arrivalTime: string;
  status: MemberStatus;
}

/**
 * Pusher 事件: 戳人
 */
export interface PokeEvent {
  fromMemberId: number;
  fromNickname: string;
  toMemberId: number;
  toNickname: string;
  count: number;
}

/**
 * Pusher 事件: 聚會結束
 */
export interface EventEndedEvent {
  eventId: number;
  endedAt: string;
}

// API Request/Response Types

/**
 * 建立聚會請求
 */
export interface CreateEventRequest {
  name: string;
  ownerName: string;
  startTime: string;
  endTime: string;
  meetingPointLat?: number;
  meetingPointLng?: number;
  meetingPointName?: string;
  meetingPointAddress?: string;
  useMeetHalf?: boolean;
  groupId?: number;
}

/**
 * 建立聚會回應
 */
export interface CreateEventResponse {
  event: Event;
  shareUrl: string;
}

/**
 * 加入聚會請求 (Guest)
 */
export interface JoinEventRequest {
  nickname: string;
  shareLocation: boolean;
  travelMode?: TravelMode;
}

/**
 * 加入聚會回應 (Guest)
 */
export interface JoinEventResponse {
  member: EventMember;
  guestToken: string;
}

/**
 * 更新位置請求
 */
export interface UpdateLocationRequest {
  lat: number;
  lng: number;
}

/**
 * 更新位置回應
 */
export interface UpdateLocationResponse {
  success: boolean;
  location: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
}

/**
 * 標記到達回應
 */
export interface MarkArrivalResponse {
  success: boolean;
  arrivalTime: string;
  status: MemberStatus;
  lateMinutes: number;
}

/**
 * 戳人請求
 */
export interface PokeRequest {
  targetMemberId: number;
}

/**
 * 戳人回應
 */
export interface PokeResponse {
  success: boolean;
  pokeCount: number;    // 我戳此人的次數
  totalPokes: number;   // 此人被戳的總次數
}

/**
 * 取得聚會資訊回應
 */
export interface GetEventResponse {
  event: Event & {
    members: EventMember[];
  };
}

/**
 * 取得聚會結果回應
 */
export interface GetEventResultResponse {
  result: EventResult;
}

/**
 * 取得我的聚會列表回應
 */
export interface GetMyEventsResponse {
  events: MyEventItem[];
  total: number;
  hasMore: boolean;
}

/**
 * 取得個人統計回應
 */
export interface GetUserStatsResponse {
  stats: UserStats;
}

/**
 * API 錯誤回應
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

