import api from './axios';

export interface User {
  id: number;
  userId: string;
  email: string;
  name: string;
  avatar: string | null;
}

export interface Group {
  id: number;
  name: string;
  ownerId: string; // userId (String) from backend
  createdAt: string;
  owner: User | null;
  members: User[]; // Group members are Users (many-to-many relation)
  _count?: {
    members: number;
  };
}

export type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling' | 'motorcycle';

export interface Member {
  id: number;
  userId: number | null;  // ✅ Nullable for offline members
  groupId: number;
  lat: number | null;
  lng: number | null;
  address: string | null;
  travelMode: TravelMode | null;
  nickname: string | null;  // ✅ NEW: For offline members
  createdAt: string;
  updatedAt: string;
  user: User | null;  // ✅ Nullable for offline members
  group?: {
    id: number;
    name: string;
  };
}

export interface CreateGroupRequest {
  name: string;
}

export interface UpdateGroupRequest {
  name: string;
}

export interface AddMemberRequest {
  userId: number;
  groupId: number;
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
    userId: number;
    userEmail: string;
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
    userId: number;
    userEmail: string;
    travelTime: number;
    distance: number;
  }>;
  candidates_count: number;
  cached: boolean;
}

export interface RoutesResponse {
  routes: Array<{
    memberId: number;
    memberEmail: string;
    polyline: string;
    duration: number;
    distance: number;
  }>;
  cached: boolean;
}

// Events API
export const groupsApi = {
  // Get all groups for current user
  async getGroups(): Promise<{ groups: Group[] }> {
    const response = await api.get('/groups');
    return response.data;
  },

  // Create a new group
  async createGroup(data: CreateGroupRequest): Promise<{ group: Group }> {
    const response = await api.post('/groups', data);
    return response.data;
  },

  // Get group details
  async getGroup(id: number): Promise<{ group: Group }> {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  // Update group name (owner only)
  async updateGroup(id: number, data: UpdateGroupRequest): Promise<{ group: Group }> {
    const response = await api.patch(`/groups/${id}`, data);
    return response.data;
  },

  // Delete group (owner only)
  async deleteGroup(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  // Get midpoint calculation
  async getMidpoint(id: number): Promise<MidpointResponse> {
    const response = await api.get(`/groups/${id}/midpoint`);
    return response.data;
  },

  // Get time-based midpoint calculation
  async getTimeMidpoint(id: number, params: { objective: string; forceRecalculate?: boolean }): Promise<TimeMidpointResponse> {
    const response = await api.get(`/groups/${id}/midpoint_by_time`, { params });
    return response.data;
  },

  // Get routes to midpoint
  async getRoutesToMidpoint(id: number, params: { midpointLat: number; midpointLng: number }): Promise<RoutesResponse> {
    const response = await api.get(`/groups/${id}/routes_to_midpoint`, { params });
    return response.data;
  },
};

// Members API
export const membersApi = {
  // Add member to group
  async addMember(data: AddMemberRequest): Promise<{ member: Member }> {
    const response = await api.post('/members', data);
    return response.data;
  },

  // Update member location
  async updateMemberLocation(id: number, data: UpdateMemberLocationRequest): Promise<{ member: Member }> {
    const response = await api.patch(`/members/${id}`, data);
    return response.data;
  },

  // Remove member from group
  async removeMember(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },
};

// Utility functions
export const groupUtils = {
  // Check if user is group owner
  isOwner: (group: Group, userId: number): boolean => {
    return group.ownerId === userId;
  },

  // Get current user's membership in group
  getCurrentUserMember: (group: Group, userId: number): Member | undefined => {
    return group.members.find(member => member.userId === userId);
  },

  // Count members with locations set
  getMembersWithLocations: (group: Group): Member[] => {
    return group.members.filter(member => member.lat !== null && member.lng !== null);
  },

  // Check if midpoint can be calculated (at least 2 members with locations)
  canCalculateMidpoint: (group: Group): boolean => {
    return groupUtils.getMembersWithLocations(group).length >= 2;
  },
};

// ✅ NEW: API functions for offline members
export const offlineMembersApi = {
  async create(data: {
    groupId: number;
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
