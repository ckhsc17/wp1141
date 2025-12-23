import { chatRepository } from '../repositories/ChatRepository';
import { notificationRepository } from '../repositories/NotificationRepository';
import { triggerChatChannel, triggerNotificationChannel } from '../lib/pusher';
import { sendPushNotification } from '../lib/pusherBeams';
import prisma from '../lib/prisma';

export class ChatService {
  /**
   * Send a message
   */
  async sendMessage(data: {
    content: string;
    senderId: string;
    receiverId?: string;
    groupId?: number;
  }) {
    // Validate that either receiverId or groupId is provided
    if (!data.receiverId && !data.groupId) {
      throw new Error('Either receiverId or groupId must be provided');
    }

    if (data.receiverId && data.groupId) {
      throw new Error('Cannot send to both user and group');
    }

    // Create message
    const message = await chatRepository.createMessage(data);

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { userId: data.senderId },
      select: { userId: true, name: true, avatar: true },
    });

    const messageWithSender = {
      ...message,
      sender,
    };

    // Trigger real-time event
    if (data.receiverId) {
      // Private message - trigger for both sender and receiver
      triggerChatChannel('user', data.receiverId, 'new-message', messageWithSender);
      triggerChatChannel('user', data.senderId, 'new-message', messageWithSender);

      // Send push notification to receiver
      if (sender) {
        await sendPushNotification(
          `user-${data.receiverId}`,
          sender.name,
          data.content.substring(0, 100), // Limit length
          {
            url: `/chat/user/${data.senderId}`,
            type: 'NEW_MESSAGE',
            senderId: data.senderId,
          }
        );
      }

      // Create notification for receiver
      if (sender) {
        await notificationRepository.createNotification({
          userId: data.receiverId,
          type: 'NEW_MESSAGE',
          title: `來自 ${sender.name} 的訊息`,
          body: data.content.substring(0, 100),
          data: {
            senderId: data.senderId,
            messageId: message.id,
          },
        });
      }
    } else if (data.groupId) {
      // Group message - trigger for group
      triggerChatChannel('group', data.groupId, 'new-message', messageWithSender);

      // Get group members
      const group = await prisma.group.findUnique({
        where: { id: data.groupId },
        include: {
          members: {
            select: { userId: true },
          },
        },
      });

      if (group && sender) {
        // Send push notification to all group members except sender
        const memberUserIds = group.members
          .map((m) => m.userId)
          .filter((uid) => uid !== null && uid !== data.senderId); // Filter out null userIds

        for (const memberId of memberUserIds) {
          if (!memberId) continue; // Extra safety check

          await sendPushNotification(
            `user-${memberId}`,
            `${group.name}`,
            `${sender.name}: ${data.content.substring(0, 100)}`,
            {
              url: `/chat/group/${data.groupId}`,
              type: 'NEW_MESSAGE',
              groupId: data.groupId,
              senderId: data.senderId,
            }
          );

          // Create notification for member
          await notificationRepository.createNotification({
            userId: memberId,
            type: 'NEW_MESSAGE',
            title: `${group.name}`,
            body: `${sender.name}: ${data.content.substring(0, 100)}`,
            data: {
              groupId: data.groupId,
              senderId: data.senderId,
              messageId: message.id,
            },
          });
        }
      }
    }

    return messageWithSender;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(data: {
    userId: string;
    receiverId?: string;
    groupId?: number;
    limit?: number;
    offset?: number;
  }) {
    if (data.receiverId) {
      return chatRepository.getPrivateMessages(
        data.userId,
        data.receiverId,
        data.limit,
        data.offset
      );
    } else if (data.groupId) {
      // Verify user is a member of the group
      const group = await prisma.group.findFirst({
        where: {
          id: data.groupId,
          members: {
            some: {
              userId: data.userId,
            },
          },
        },
      });

      if (!group) {
        throw new Error('Not a member of this group');
      }

      return chatRepository.getGroupMessages(data.groupId, data.limit, data.offset);
    } else {
      throw new Error('Either receiverId or groupId must be provided');
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: number, userId: string) {
    const message = await chatRepository.markAsRead(messageId, userId);

    if (message) {
      // Trigger read receipt
      if (message.receiverId) {
        triggerChatChannel('user', message.senderId, 'message-read', {
          messageId,
          readBy: userId,
        });
      } else if (message.groupId) {
        triggerChatChannel('group', message.groupId, 'message-read', {
          messageId,
          readBy: userId,
        });
      }
    }

    return message;
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(userId: string, receiverId?: string, groupId?: number) {
    const messages = await chatRepository.markConversationAsRead(userId, receiverId, groupId);

    // Only trigger read receipts if there are messages marked
    // Batch trigger: send one event per conversation instead of per message
    if (messages.length > 0) {
      const firstMessage = messages[0];
      if (firstMessage.receiverId) {
        // Private conversation - trigger for sender
        triggerChatChannel('user', firstMessage.senderId, 'conversation-read', {
          receiverId: userId,
          messageIds: messages.map(m => m.id),
        });
      } else if (firstMessage.groupId) {
        // Group conversation - trigger for group
        triggerChatChannel('group', firstMessage.groupId, 'conversation-read', {
          readBy: userId,
          messageIds: messages.map(m => m.id),
        });
      }
    }

    return messages.length;
  }

  /**
   * Get conversation list
   */
  async getConversations(userId: string) {
    return chatRepository.getConversations(userId);
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string) {
    return chatRepository.getUnreadCount(userId);
  }

  /**
   * Search messages
   */
  async searchMessages(userId: string, keyword: string) {
    return chatRepository.searchMessages(userId, keyword);
  }
}

export const chatService = new ChatService();

