import api from './axios';
import { ChatMessage, Conversation, SendMessageRequest } from '../types/chat';

export const chatApi = {
  // Send message
  sendMessage: async (data: SendMessageRequest): Promise<{ message: ChatMessage }> => {
    const response = await api.post('/chat/messages', data);
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (params: {
    receiverId?: string;
    groupId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: ChatMessage[] }> => {
    const response = await api.get('/chat/messages', { params });
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId: number): Promise<{ success: boolean }> => {
    const response = await api.put(`/chat/messages/${messageId}/read`);
    return response.data;
  },

  // Mark entire conversation as read
  markConversationAsRead: async (params: {
    receiverId?: string;
    groupId?: number;
  }): Promise<{ success: boolean; count: number }> => {
    const response = await api.put('/chat/conversations/read', params);
    return response.data;
  },

  // Get conversation list
  getConversations: async (): Promise<{ conversations: Conversation[] }> => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },

  // Search messages
  searchMessages: async (query: string, limit = 20): Promise<{ messages: ChatMessage[] }> => {
    const response = await api.get('/chat/search', { params: { q: query, limit } });
    return response.data;
  },
};

