import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../api/friends';
import { Friend, FriendRequest, User } from '../types/friend';

export function useFriends() {
  const queryClient = useQueryClient();
  const [requestType, setRequestType] = useState<'received' | 'sent'>('received');
  const [searchQuery, setSearchQuery] = useState('');

  // Query for friends list
  const {
    data: friends = [],
    isLoading: friendsLoading,
    error: friendsError,
    refetch: loadFriends,
  } = useQuery<Friend[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const { friends: data } = await friendsApi.getFriends();
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Query for friend requests
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
    refetch: loadRequests,
  } = useQuery<FriendRequest[]>({
    queryKey: ['friendRequests', requestType],
    queryFn: async () => {
      const { requests: data } = await friendsApi.getRequests(requestType);
      return data;
    },
    staleTime: 10 * 1000, // 10 seconds
  });

  // Query for user search (only when query is provided)
  const {
    data: searchResults = [],
    isLoading: searchLoading,
  } = useQuery<User[]>({
    queryKey: ['userSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { users } = await friendsApi.searchUsers(searchQuery);
      return users;
    },
    enabled: !!searchQuery.trim(),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for sending friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (toUserId: string) => {
      await friendsApi.sendRequest(toUserId);
      return toUserId;
    },
    onSuccess: () => {
      // Invalidate requests to refresh the list
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  // Mutation for accepting friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await friendsApi.acceptRequest(requestId);
      return requestId;
    },
    onSuccess: (requestId) => {
      // Optimistically remove from requests
      queryClient.setQueryData<FriendRequest[]>(['friendRequests', requestType], (old = []) => {
        return old.filter((r) => r.id !== requestId);
      });
      // Invalidate friends to refresh the list
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      // Invalidate all request types
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  // Mutation for rejecting friend request
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await friendsApi.rejectRequest(requestId);
      return requestId;
    },
    onSuccess: (requestId) => {
      // Optimistically remove from requests
      queryClient.setQueryData<FriendRequest[]>(['friendRequests', requestType], (old = []) => {
        return old.filter((r) => r.id !== requestId);
      });
      // Invalidate all request types
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  // Mutation for deleting friend
  const deleteFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await friendsApi.deleteFriend(friendId);
      return friendId;
    },
    onSuccess: (friendId) => {
      // Optimistically remove from friends
      queryClient.setQueryData<Friend[]>(['friends'], (old = []) => {
        return old.filter((f) => f.userId !== friendId);
      });
    },
  });

  // Wrapper functions for backward compatibility
  const sendRequest = useCallback(async (toUserId: string) => {
    try {
      await sendRequestMutation.mutateAsync(toUserId);
      return true;
    } catch (err: any) {
      console.error('Error sending request:', err);
      return false;
    }
  }, [sendRequestMutation]);

  const acceptRequest = useCallback(async (requestId: number) => {
    try {
      await acceptRequestMutation.mutateAsync(requestId);
      return true;
    } catch (err: any) {
      console.error('Error accepting request:', err);
      return false;
    }
  }, [acceptRequestMutation]);

  const rejectRequest = useCallback(async (requestId: number) => {
    try {
      await rejectRequestMutation.mutateAsync(requestId);
      return true;
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      return false;
    }
  }, [rejectRequestMutation]);

  const deleteFriend = useCallback(async (friendId: string) => {
    try {
      await deleteFriendMutation.mutateAsync(friendId);
      return true;
    } catch (err: any) {
      console.error('Error deleting friend:', err);
      return false;
    }
  }, [deleteFriendMutation]);

  const searchUsers = useCallback(async (query: string) => {
    setSearchQuery(query);
    // Query will automatically run when searchQuery changes
  }, []);

  // Helper to change request type
  const setRequestTypeAndLoad = useCallback((type: 'received' | 'sent') => {
    setRequestType(type);
    // Query will automatically refetch when requestType changes
  }, []);

  return {
    friends,
    requests,
    searchResults,
    loading: friendsLoading || requestsLoading || searchLoading,
    error: friendsError || requestsError,
    loadFriends,
    loadRequests: () => loadRequests(),
    sendRequest,
    acceptRequest,
    rejectRequest,
    deleteFriend,
    searchUsers,
    // Additional helpers
    requestType,
    setRequestType: setRequestTypeAndLoad,
  };
}
