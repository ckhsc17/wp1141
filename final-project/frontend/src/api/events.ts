import api from './axios';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string | null;
  provider?: string | null;
}

export interface Event {
  id: number;
  name: string;
  ownerId: string; // Owner's userId (not foreign key - allows anonymous users)
  meetingPointLat?: number | null;
  meetingPointLng?: number | null;
  meetingPointName?: string | null;
  meetingPointAddress?: string | null;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  status: 'upcoming' | 'ongoing' | 'ended';
  useMeetHalf: boolean;
  groupId?: number | null;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  _count?: {
    members: number;
  };
}

export type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling' | 'motorcycle';

export interface Member {
  id: number;
  userId: string | null;
  eventId: number;
  lat: number | null;
  lng: number | null;
  address: string | null;
  travelMode: TravelMode | null;
  nickname: string | null;
  shareLocation: boolean;
  arrivalTime: string | null; // ISO 8601
  avatar?: string | null; // User avatar URL
  createdAt: string;
  updatedAt: string;
}

export interface MemberETA {
  memberId: number;
  nickname: string;
  eta: {
    duration: string; // "15 分鐘"
    durationValue: number; // seconds
    distance: string; // "2.5 公里"
  } | null;
  movementStarted?: boolean; // 是否已開始移動
  isCountdown?: boolean; // 是否為倒數模式（transit）
}

// ETA 更新事件（來自 Pusher）
export interface ETAUpdateEvent {
  memberId: number;
  nickname: string;
  eta: number | null; // ETA in seconds
  etaText: string | null;
  distance: string | null;
  distanceValue: number | null;
  movementStarted: boolean;
  isCountdown: boolean;
  timestamp: number;
}

export interface CreateEventRequest {
  name: string;
  startTime?: string; // ISO 8601 - Optional, defaults to 1 hour from now
  endTime?: string; // ISO 8601 - Optional, defaults to 3 hours from now
  ownerId?: string; // Optional: auto-filled from JWT if authenticated
  useMeetHalf?: boolean;
  status?: 'upcoming' | 'ongoing' | 'ended';
  meetingPointLat?: number | null;
  meetingPointLng?: number | null;
  meetingPointName?: string | null;
  meetingPointAddress?: string | null;
  groupId?: number | null;
  // 主辦信息（可選，如果提供則自動創建 member）
  ownerNickname?: string;
  ownerTravelMode?: TravelMode;
  ownerShareLocation?: boolean;
  // 邀請好友列表（可選）
  invitedFriendIds?: string[];
}

export interface UpdateEventRequest {
  name?: string;
  startTime?: string; // ISO 8601
  endTime?: string; // ISO 8601
  meetingPointLat?: number | null;
  meetingPointLng?: number | null;
  meetingPointName?: string | null;
  meetingPointAddress?: string | null;
}

export interface AddMemberRequest {
  username: string;
  eventId: number;
  lat?: number;
  lng?: number;
  address?: string;
  travelMode?: TravelMode;
}

export interface UpdateMemberLocationRequest {
  lat?: number;
  lng?: number;
  address?: string;
  travelMode?: TravelMode;
}

export interface MidpointResponse {
  midpoint: {
    lat: number;
    lng: number;
  };
  address: string;
  suggested_places: Array<{
    name: string;
    address: string;
    rating?: number;
    types: string[];
    place_id: string;
  }>;
  member_travel_times: Array<{
    username: string;
    memberId: number;
    travelMode: string;
    duration: string;
    durationValue: number | null;
    distance: string;
    distanceValue: number | null;
  }>;
  member_count: number;
  cached: boolean;
}

export interface TimeMidpointResponse {
  midpoint: {
    name: string;
    lat: number;
    lng: number;
    address: string;
    place_id: string;
  };
  metric: {
    total: number;
    max: number;
  };
  members: Array<{
    memberId: number;
    username: string;
    travelTime: number;
    distance: number;
  }>;
  candidates_count: number;
  cached: boolean;
}

export interface RoutesResponse {
  routes: Array<{
    memberId: number;
    username: string;
    polyline: string;
    duration: number;
    distance: number;
  }>;
  cached: boolean;
}

// Events API
export const eventsApi = {
  // Get all events for current user (or empty array for anonymous)
  async getEvents(): Promise<{ events: Event[] }> {
    const response = await api.get('/events');
    return response.data;
  },

  // Create a new event
  async createEvent(data: CreateEventRequest): Promise<{ 
    event: Event;
    member?: Member; // 如果提供了主辦信息，會自動創建 member
    guestToken?: string; // 如果是匿名用戶，會返回 guestToken
  }> {
    const response = await api.post('/events', data);
    return response.data;
  },

  // Get event details
  async getEvent(id: number): Promise<{ event: Event }> {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Update event name
  async updateEvent(id: number, data: UpdateEventRequest): Promise<{ event: Event }> {
    const response = await api.patch(`/events/${id}`, data);
    return response.data;
  },

  // Delete event
  async deleteEvent(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  // Get midpoint calculation
  async getMidpoint(id: number): Promise<MidpointResponse> {
    const response = await api.get(`/events/${id}/midpoint`);
    return response.data;
  },

  // Get time-based midpoint calculation
  async getTimeMidpoint(id: number, params: { objective: string; forceRecalculate?: boolean }): Promise<TimeMidpointResponse> {
    const response = await api.get(`/events/${id}/midpoint_by_time`, { params });
    return response.data;
  },

  // Get routes to midpoint
  async getRoutesToMidpoint(id: number, params: { midpointLat: number; midpointLng: number }): Promise<RoutesResponse> {
    const response = await api.get(`/events/${id}/routes_to_midpoint`, { params });
    return response.data;
  },

  // Poke a member
  async pokeMember(eventId: number, targetMemberId: number): Promise<{ success: boolean; pokeCount: number; totalPokes: number }> {
    const response = await api.post(`/events/${eventId}/poke`, { targetMemberId });
    return response.data;
  },

  // Join event as guest
  async joinEvent(eventId: number, data: {
    nickname: string;
    shareLocation: boolean;
    travelMode?: TravelMode;
  }): Promise<{ member: Member; guestToken: string }> {
    const response = await api.post(`/events/${eventId}/join`, data);
    return response.data;
  },

  // Mark arrival
  async markArrival(eventId: number): Promise<{
    success: boolean;
    arrivalTime: string;
    status: 'early' | 'ontime' | 'late';
    lateMinutes?: number;
  }> {
    const response = await api.post(`/events/${eventId}/arrival`);
    return response.data;
  },

  // Update location
  async updateLocation(eventId: number, data: {
    lat: number;
    lng: number;
    address?: string;
    travelMode?: TravelMode;
  }): Promise<{ member: Member }> {
    const response = await api.post(`/events/${eventId}/location`, data);
    return response.data;
  },

  // Get members ETA
  async getMembersETA(eventId: number): Promise<{ members: MemberETA[] }> {
    const response = await api.get(`/events/${eventId}/members/eta`);
    return response.data;
  },

  // Get event result (rankings)
  async getEventResult(eventId: number): Promise<import('../types/events').GetEventResultResponse> {
    const response = await api.get(`/events/${eventId}/result`);
    return response.data;
  },

  // Get share token for event
  async getShareToken(eventId: number): Promise<{ token: string }> {
    const response = await api.get(`/events/${eventId}/share-token`);
    return response.data;
  },

  // Generate or regenerate share token for event
  async createShareToken(eventId: number): Promise<{ token: string }> {
    const response = await api.post(`/events/${eventId}/share-token`);
    return response.data;
  },
};

// Invite API
export const inviteApi = {
  // Resolve invite token to event ID
  async resolveInviteToken(token: string): Promise<{ eventId: number }> {
    const response = await api.get(`/invite/${token}`);
    return response.data;
  },
};

// Members API
export const membersApi = {
  // Add member to event
  async addMember(data: AddMemberRequest): Promise<{ member: Member }> {
    const response = await api.post('/members', data);
    return response.data;
  },

  // Update member location
  async updateMemberLocation(id: number, data: UpdateMemberLocationRequest): Promise<{ member: Member }> {
    const response = await api.patch(`/members/${id}`, data);
    return response.data;
  },

  // Remove member from event
  async removeMember(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },
};

// Utility functions
export const eventUtils = {
  // Check if user is event owner (by userId)
  isOwner: (event: Event, userUserId: string | null): boolean => {
    return userUserId ? event.ownerId === userUserId : false;
  },

  // Get current user's membership in event
  getCurrentUserMember: (event: Event, userUserId: string | null): Member | undefined => {
    if (!userUserId) return undefined;
    return event.members.find(member => member.userId === userUserId);
  },

  // Count members with locations set
  getMembersWithLocations: (event: Event): Member[] => {
    return event.members.filter(member => member.lat !== null && member.lng !== null);
  },

  // Check if midpoint can be calculated (at least 2 members with locations)
  canCalculateMidpoint: (event: Event): boolean => {
    return eventUtils.getMembersWithLocations(event).length >= 2;
  },
};

// API functions for offline members
export const offlineMembersApi = {
  async create(data: {
    eventId: number;
    nickname: string;
    lat: number;
    lng: number;
    address?: string;
    travelMode?: string;
  }): Promise<{ member: Member }> {
    const response = await api.post('/members/offline', data);
    return response.data;
  },

  async update(
    id: number,
    data: {
      nickname?: string;
      lat?: number;
      lng?: number;
      address?: string;
      travelMode?: string;
    }
  ): Promise<{ member: Member }> {
    const response = await api.patch(`/members/offline/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/members/offline/${id}`);
  }
};

// Temporary midpoint calculation (no event required)
export interface CalculateMidpointRequest {
  locations: Array<{
    lat: number;
    lng: number;
    travelMode: TravelMode;
  }>;
  useMeetHalf?: boolean;
}

export interface CalculateMidpointResponse {
  midpoint: {
    lat: number;
    lng: number;
  };
  address: string;
  suggested_places: Array<{
    name: string;
    address: string;
    rating?: number;
    types: string[];
    place_id: string;
    lat?: number;
    lng?: number;
  }>;
  travel_times: Array<{
    locationIndex: number;
    travelMode: string;
    duration: string;
    durationValue: number | null;
    distance: string;
    distanceValue: number | null;
  }>;
  location_count: number;
  cached: boolean;
}

export const calculateTempMidpoint = async (
  data: CalculateMidpointRequest
): Promise<CalculateMidpointResponse> => {
  const response = await api.post('/events/calculate-midpoint', data);
  return response.data;
};

