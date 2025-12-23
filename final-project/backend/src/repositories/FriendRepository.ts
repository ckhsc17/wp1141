import prisma from '../lib/prisma';
import { FriendRequestStatus } from '@prisma/client';

export class FriendRepository {
  /**
   * Create a friend relationship (one direction)
   */
  async createFriend(userId: string, friendId: string) {
    return prisma.friend.create({
      data: {
        userId,
        friendId,
      },
    });
  }

  /**
   * Create bidirectional friend relationship
   */
  async createFriendship(userId: string, friendId: string) {
    await prisma.$transaction([
      prisma.friend.create({
        data: { userId, friendId },
      }),
      prisma.friend.create({
        data: { userId: friendId, friendId: userId },
      }),
    ]);
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const friendship = await prisma.friend.findFirst({
      where: {
        userId,
        friendId,
      },
    });
    return !!friendship;
  }

  /**
   * Get all friends for a user
   */
  async getFriends(userId: string) {
    const friends = await prisma.friend.findMany({
      where: { userId },
      select: {
        friendId: true,
        createdAt: true,
      },
    });

    // Get user info for each friend
    const friendIds = friends.map((f) => f.friendId);
    const users = await prisma.user.findMany({
      where: {
        userId: { in: friendIds },
      },
      select: {
        userId: true,
        name: true,
        email: true,
        avatar: true,
        defaultLat: true,
        defaultLng: true,
        defaultAddress: true,
        defaultLocationName: true,
        defaultTravelMode: true,
      },
    });

    // Map users with their friendship createdAt
    const friendMap = new Map(friends.map((f) => [f.friendId, f.createdAt]));
    return users
      .filter((user) => user.userId !== null) // Filter out users without userId
      .map((user) => ({
        ...user,
        userId: user.userId!, // Safe to assert non-null after filter
        createdAt: friendMap.get(user.userId!)?.toISOString() || new Date().toISOString(),
      }));
  }

  /**
   * Delete friendship (bidirectional)
   */
  async deleteFriendship(userId: string, friendId: string) {
    await prisma.$transaction([
      prisma.friend.deleteMany({
        where: { userId, friendId },
      }),
      prisma.friend.deleteMany({
        where: { userId: friendId, friendId: userId },
      }),
    ]);
  }

  /**
   * Create friend request
   * If a request already exists (even if accepted/rejected), update it to pending
   */
  async createFriendRequest(fromUserId: string, toUserId: string) {
    // Try to find existing request
    const existing = await prisma.friendRequest.findFirst({
      where: {
        fromUserId,
        toUserId,
      },
    });

    if (existing) {
      // Update existing request to pending
      return prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: 'pending' },
      });
    }

    // Create new request
    return prisma.friendRequest.create({
      data: {
        fromUserId,
        toUserId,
        status: 'pending',
      },
    });
  }

  /**
   * Get friend request by ID
   */
  async getFriendRequestById(id: number) {
    return prisma.friendRequest.findUnique({
      where: { id },
    });
  }

  /**
   * Get received friend requests for a user
   */
  async getReceivedRequests(userId: string, status?: FriendRequestStatus) {
    const requests = await prisma.friendRequest.findMany({
      where: {
        toUserId: userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user info for each requester
    const fromUserIds = requests.map((r) => r.fromUserId);
    const users = await prisma.user.findMany({
      where: {
        userId: { in: fromUserIds },
      },
      select: {
        userId: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    // Map user info to requests
    const usersMap = new Map(users.map((u) => [u.userId, u]));
    return requests.map((r) => ({
      ...r,
      fromUser: usersMap.get(r.fromUserId),
    }));
  }

  /**
   * Get sent friend requests for a user
   */
  async getSentRequests(userId: string, status?: FriendRequestStatus) {
    const requests = await prisma.friendRequest.findMany({
      where: {
        fromUserId: userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user info for each recipient
    const toUserIds = requests.map((r) => r.toUserId);
    const users = await prisma.user.findMany({
      where: {
        userId: { in: toUserIds },
      },
      select: {
        userId: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    // Map user info to requests
    const usersMap = new Map(users.map((u) => [u.userId, u]));
    return requests.map((r) => ({
      ...r,
      toUser: usersMap.get(r.toUserId),
    }));
  }

  /**
   * Check if friend request exists between two users
   */
  async hasPendingRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const request = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId, status: 'pending' },
          { fromUserId: toUserId, toUserId: fromUserId, status: 'pending' },
        ],
      },
    });
    return !!request;
  }

  /**
   * Update friend request status
   */
  async updateRequestStatus(id: number, status: FriendRequestStatus) {
    return prisma.friendRequest.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Search users by name or userId
   */
  async searchUsers(keyword: string, excludeUserId?: string) {
    return prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' } },
              { userId: { contains: keyword, mode: 'insensitive' } },
              { email: { contains: keyword, mode: 'insensitive' } },
            ],
          },
          ...(excludeUserId ? [{ userId: { not: excludeUserId } }] : []),
        ],
      },
      select: {
        userId: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: 20,
    });
  }
}

export const friendRepository = new FriendRepository();

