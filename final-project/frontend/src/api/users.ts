import api from './axios';
import { User } from '../types/friend';

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string | null;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultAddress?: string | null;
  defaultLocationName?: string | null;
  defaultTravelMode?: 'driving' | 'transit' | 'walking' | 'bicycling' | null;
}

export interface CheckUserIdRequest {
  userId: string;
}

export interface CompleteSetupRequest {
  userId: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultAddress?: string | null;
  defaultLocationName?: string | null;
  defaultTravelMode?: 'driving' | 'transit' | 'walking' | 'bicycling' | null;
}

export const usersApi = {
  // Get user profile
  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<{ user: User }> => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },

  // Get user stats
  getStats: async (): Promise<{ stats: any }> => {
    const response = await api.get('/users/me/stats');
    return response.data;
  },

  // Check if userId is available
  checkUserIdAvailable: async (data: CheckUserIdRequest): Promise<{ available: boolean }> => {
    const response = await api.post('/users/check-userid', data);
    return response.data;
  },

  // Complete first-time setup
  completeSetup: async (data: CompleteSetupRequest): Promise<{ user: User }> => {
    const response = await api.post('/users/complete-setup', data);
    return response.data;
  },
};

