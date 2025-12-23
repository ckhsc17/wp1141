import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat';
import { ChatMessage, Conversation } from '../types/chat';
import { usePusher } from './usePusher';

/**
 * Helper function to deduplicate messages
 */
function deduplicateMessages(prev: ChatMessage[], newMessage: ChatMessage): ChatMessage[] {
  // Check if message already exists by ID
  const existingIndex = prev.findIndex((m) => m.id === newMessage.id);
  if (existingIndex !== -1) {
    console.log('[useChat] Duplicate message detected by ID, updating:', newMessage.id);
    // Update existing message with server data (in case it has more complete info)
    const updated = [...prev];
    updated[existingIndex] = newMessage;
    return updated;
  }
  
  // Also check for duplicate by content, sender, and timestamp (within 2 seconds)
  // This handles cases where ID might not match but it's the same message
  const duplicateIndex = prev.findIndex((m) => {
    const timeDiff = Math.abs(new Date(m.createdAt).getTime() - new Date(newMessage.createdAt).getTime());
    return (
      m.content === newMessage.content &&
      m.senderId === newMessage.senderId &&
      timeDiff < 2000 // 2 seconds
    );
  });
  
  if (duplicateIndex !== -1) {
    console.log('[useChat] Duplicate message detected by content/timestamp, updating');
    // Update existing message with server data
    const updated = [...prev];
    updated[duplicateIndex] = newMessage;
    return updated;
  }
  
  return [...prev, newMessage];
}

export function useChat(userId?: string, type?: 'user' | 'group', id?: string | number) {
  const queryClient = useQueryClient();

  // Query for conversations list
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: loadConversations,
  } = useQuery<Conversation[]>({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      const { conversations: data } = await chatApi.getConversations();
      return data;
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 seconds - conversations change frequently
  });

  // Query for messages in current conversation
  const chatId = id ? (type === 'group' ? parseInt(String(id)) : id) : undefined;
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
    refetch: loadMessages,
  } = useQuery<ChatMessage[]>({
    queryKey: ['messages', type, chatId],
    queryFn: async () => {
      if (!type || !id) return [];
      const params: { receiverId?: string; groupId?: number } = {};
      if (type === 'user') {
        params.receiverId = String(id);
      } else {
        params.groupId = parseInt(String(id));
      }
      const { messages: data } = await chatApi.getMessages(params);
      return data;
    },
    enabled: !!type && !!id && !!userId,
    staleTime: 5 * 1000, // 5 seconds - messages are real-time via Pusher
  });

  // Query for unread count
  const {
    data: unreadCount = 0,
    refetch: loadUnreadCount,
  } = useQuery<number>({
    queryKey: ['unreadCount', userId],
    queryFn: async () => {
      const { count } = await chatApi.getUnreadCount();
      return count;
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // Mutation for sending messages with optimistic update
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, receiverId, groupId }: { content: string; receiverId?: string; groupId?: number }) => {
      const { message } = await chatApi.sendMessage({ content, receiverId, groupId });
      return message;
    },
    onMutate: async ({ content, receiverId, groupId }) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', type, chatId] });
      await queryClient.cancelQueries({ queryKey: ['conversations', userId] });

      // Snapshot previous values
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['messages', type, chatId]);
      const previousConversations = queryClient.getQueryData<Conversation[]>(['conversations', userId]);

      // Optimistically update messages
      if (previousMessages && type && chatId) {
        const optimisticMessage: ChatMessage = {
          id: Date.now(), // Temporary ID
          content,
          senderId: userId || '',
          receiverId: receiverId || null,
          groupId: groupId || null,
          readBy: [userId || ''],
          createdAt: new Date().toISOString(),
          sender: undefined, // Will be filled by server response
        };
        
        queryClient.setQueryData<ChatMessage[]>(['messages', type, chatId], (old = []) => {
          return [...old, optimisticMessage];
        });
      }

      return { previousMessages, previousConversations };
    },
    onError: (_err, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', type, chatId], context.previousMessages);
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations', userId], context.previousConversations);
      }
    },
    onSuccess: (message) => {
      // Update messages with server response (replaces optimistic message)
      if (type && chatId) {
        queryClient.setQueryData<ChatMessage[]>(['messages', type, chatId], (old = []) => {
          return deduplicateMessages(old, message);
        });
      }
      
      // Invalidate conversations to refresh last message
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
    },
  });

  // Mutation for marking message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await chatApi.markAsRead(messageId);
      return messageId;
    },
    onSuccess: (messageId) => {
      // Update message readBy in cache
      if (type && chatId) {
        queryClient.setQueryData<ChatMessage[]>(['messages', type, chatId], (old = []) => {
          return old.map((m) =>
            m.id === messageId
              ? { ...m, readBy: [...new Set([...m.readBy, userId || ''])] }
              : m
          );
        });
      }
    },
  });

  // Mutation for marking conversation as read
  const markConversationAsReadMutation = useMutation({
    mutationFn: async (params: { receiverId?: string; groupId?: number }) => {
      const result = await chatApi.markConversationAsRead(params);
      return result.count;
    },
    onSuccess: () => {
      // Invalidate unread count and conversations
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
      
      // Trigger event to notify other components
      window.dispatchEvent(new CustomEvent('chat-unread-updated'));
    },
  });

  // Mutation for searching messages
  const searchMessagesMutation = useMutation({
    mutationFn: async (query: string) => {
      const { messages: data } = await chatApi.searchMessages(query);
      return data;
    },
  });

  // Set up Pusher for real-time messages
  const channelName = type && id
    ? type === 'user'
      ? `chat-user-${id}`
      : `group-${id}`
    : null;

  usePusher({
    channelName,
    eventName: 'new-message',
    onEvent: (data: ChatMessage) => {
      console.log('[useChat] New message received via Pusher:', data);
      
      // Update messages cache with deduplication
      if (type && chatId) {
        queryClient.setQueryData<ChatMessage[]>(['messages', type, chatId], (old = []) => {
          return deduplicateMessages(old, data);
        });
      }
      
      // Invalidate conversations to refresh last message
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
      
      // If user is currently in this chat and the message is from someone else, mark as read
      if (userId && type && id && data.senderId !== userId) {
        markAsReadMutation.mutate(data.id);
      }
      
      // Update unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userId] });
      window.dispatchEvent(new CustomEvent('chat-unread-updated'));
    },
  });

  // Listen for read receipts
  usePusher({
    channelName,
    eventName: 'message-read',
    onEvent: (data: { messageId: number; readBy: string }) => {
      console.log('[useChat] Message read receipt received:', data);
      
      // Update message readBy in cache
      if (type && chatId) {
        queryClient.setQueryData<ChatMessage[]>(['messages', type, chatId], (old = []) => {
          return old.map((m) =>
            m.id === data.messageId
              ? {
                  ...m,
                  readBy: [...new Set([...m.readBy, data.readBy])],
                }
              : m
          );
        });
      }
    },
  });

  // Listen for unread count updates from other components
  useEffect(() => {
    const handleUnreadUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userId] });
    };

    window.addEventListener('chat-unread-updated', handleUnreadUpdate);
    
    return () => {
      window.removeEventListener('chat-unread-updated', handleUnreadUpdate);
    };
  }, [userId, queryClient]);

  // Wrapper functions for backward compatibility
  const loadMessagesWrapper = useCallback(async (_params?: { receiverId?: string; groupId?: number; limit?: number; offset?: number }) => {
    // Parameters are ignored because query is already based on type and id
    return loadMessages();
  }, [loadMessages]);

  const sendMessage = useCallback(async (content: string, receiverId?: string, groupId?: number) => {
    try {
      const message = await sendMessageMutation.mutateAsync({ content, receiverId, groupId });
      return message;
    } catch (err: any) {
      console.error('Error sending message:', err);
      return null;
    }
  }, [sendMessageMutation]);

  const markAsRead = useCallback(async (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  }, [markAsReadMutation]);

  const markConversationAsRead = useCallback(async (params: { receiverId?: string; groupId?: number }) => {
    return await markConversationAsReadMutation.mutateAsync(params);
  }, [markConversationAsReadMutation]);

  const searchMessages = useCallback(async (query: string) => {
    try {
      return await searchMessagesMutation.mutateAsync(query);
    } catch (err: any) {
      console.error('Error searching messages:', err);
      return [];
    }
  }, [searchMessagesMutation]);

  return {
    messages,
    conversations,
    unreadCount,
    loading: conversationsLoading || messagesLoading,
    error: conversationsError || messagesError,
    loadConversations,
    loadMessages: loadMessagesWrapper,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    loadUnreadCount,
    searchMessages,
  };
}
