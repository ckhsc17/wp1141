import { friendRepository } from '../repositories/FriendRepository';
import { notificationRepository } from '../repositories/NotificationRepository';
import { triggerNotificationChannel } from '../lib/pusher';
import { sendPushNotification } from '../lib/pusherBeams';

export class FriendService {
  /**
   * Send a friend request
   */
  async sendFriendRequest(fromUserId: string, toUserId: string) {
    // Check if they are already friends
    const areFriends = await friendRepository.areFriends(fromUserId, toUserId);
    if (areFriends) {
      throw new Error('Already friends');
    }

    // Check if there's already a pending request
    const hasPending = await friendRepository.hasPendingRequest(fromUserId, toUserId);
    if (hasPending) {
      throw new Error('Friend request already exists');
    }

    // Create or update friend request
    // This will update existing request to pending if it exists (e.g., after deleting a friend)
    const request = await friendRepository.createFriendRequest(fromUserId, toUserId);

    // Create notification
    const fromUser = await prisma.user.findUnique({
      where: { userId: fromUserId },
      select: { name: true, userId: true },
    });

    if (fromUser) {
      const notification = await notificationRepository.createNotification({
        userId: toUserId,
        type: 'FRIEND_REQUEST',
        title: '好友邀請',
        body: `${fromUser.name} 想加你為好友`,
        data: {
          requestId: request.id,
          fromUserId: fromUser.userId,
          fromUserName: fromUser.name,
        },
      });

      // Trigger real-time notification via Pusher
      triggerNotificationChannel(toUserId, 'friend-request', {
        notification,
        request,
        fromUser,
      });

      // Send push notification via Pusher Beams
      await sendPushNotification(
        `user-${toUserId}`,
        '好友邀請',
        `${fromUser.name} 想加你為好友`,
        {
          url: '/notifications',
          type: 'FRIEND_REQUEST',
          requestId: request.id,
        }
      );
    }

    return request;
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: number, userId: string) {
    const request = await friendRepository.getFriendRequestById(requestId);
    
    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.toUserId !== userId) {
      throw new Error('Unauthorized');
    }

    if (request.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    // Update request status
    await friendRepository.updateRequestStatus(requestId, 'accepted');

    // Create bidirectional friendship
    await friendRepository.createFriendship(request.fromUserId, request.toUserId);

    // Create notification for requester
    const toUser = await prisma.user.findUnique({
      where: { userId: request.toUserId },
      select: { name: true, userId: true },
    });

    if (toUser) {
      const notification = await notificationRepository.createNotification({
        userId: request.fromUserId,
        type: 'FRIEND_ACCEPTED',
        title: '好友請求已接受',
        body: `${toUser.name} 接受了你的好友邀請`,
        data: {
          friendId: toUser.userId,
          friendName: toUser.name,
        },
      });

      // Trigger real-time notification via Pusher
      triggerNotificationChannel(request.fromUserId, 'friend-accepted', {
        notification,
        friend: toUser,
      });

      // Send push notification via Pusher Beams
      await sendPushNotification(
        `user-${request.fromUserId}`,
        '好友請求已接受',
        `${toUser.name} 接受了你的好友邀請`,
        {
          url: '/friends',
          type: 'FRIEND_ACCEPTED',
          friendId: toUser.userId,
        }
      );
    }

    return { success: true };
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(requestId: number, userId: string) {
    const request = await friendRepository.getFriendRequestById(requestId);
    
    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.toUserId !== userId) {
      throw new Error('Unauthorized');
    }

    if (request.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    // Update request status
    await friendRepository.updateRequestStatus(requestId, 'rejected');

    return { success: true };
  }

  /**
   * Get friend list
   */
  async getFriends(userId: string) {
    return friendRepository.getFriends(userId);
  }

  /**
   * Get friend requests
   */
  async getFriendRequests(userId: string, type: 'received' | 'sent' = 'received') {
    if (type === 'received') {
      return friendRepository.getReceivedRequests(userId, 'pending');
    } else {
      return friendRepository.getSentRequests(userId);
    }
  }

  /**
   * Delete a friend
   */
  async deleteFriend(userId: string, friendId: string) {
    const areFriends = await friendRepository.areFriends(userId, friendId);
    if (!areFriends) {
      throw new Error('Not friends');
    }

    await friendRepository.deleteFriendship(userId, friendId);
    return { success: true };
  }

  /**
   * Search users
   */
  async searchUsers(keyword: string, excludeUserId?: string) {
    return friendRepository.searchUsers(keyword, excludeUserId);
  }
}

// Need to import prisma
import prisma from '../lib/prisma';

export const friendService = new FriendService();

