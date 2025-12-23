export interface ChatMessage {
  id: number;
  content: string;
  senderId: string;
  receiverId: string | null;
  groupId: number | null;
  readBy: string[];
  createdAt: string;
  sender?: {
    userId: string;
    name: string;
    avatar: string | null;
  };
}

export interface Conversation {
  type: 'user' | 'group';
  id: string | number;
  name: string;
  avatar: string | null;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface SendMessageRequest {
  content: string;
  receiverId?: string;
  groupId?: number;
}

