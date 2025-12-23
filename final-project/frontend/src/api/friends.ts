import api from './axios';
import { Friend, FriendRequest, User } from '../types/friend';

export const friendsApi = {
  // Send friend request
  sendRequest: async (toUserId: string): Promise<{ request: FriendRequest }> => {
    const response = await api.post('/friends/requests', { toUserId });
    return response.data;
  },

  // Get friend requests
  getRequests: async (type: 'received' | 'sent' = 'received'): Promise<{ requests: FriendRequest[] }> => {
    const response = await api.get('/friends/requests', { params: { type } });
    return response.data;
  },

  // Accept friend request
  acceptRequest: async (requestId: number): Promise<{ success: boolean }> => {
    const response = await api.post(`/friends/requests/${requestId}/accept`);
    return response.data;
  },

  // Reject friend request
  rejectRequest: async (requestId: number): Promise<{ success: boolean }> => {
    const response = await api.post(`/friends/requests/${requestId}/reject`);
    return response.data;
  },

  // Get friends list
  getFriends: async (): Promise<{ friends: Friend[] }> => {
    const response = await api.get('/friends');
    return response.data;
  },

  // Delete friend
  deleteFriend: async (friendId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query: string): Promise<{ users: User[] }> => {
    const response = await api.get('/friends/search', { params: { q: query } });
    return response.data;
  },
};

