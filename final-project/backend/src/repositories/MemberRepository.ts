import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class MemberRepository {
  /**
   * Find member by ID with user avatar if userId is a real user
   */
  async findById(id: number) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    // If member has userId and it's not a guest ID, fetch user avatar
    if (member && member.userId && !member.userId.startsWith('guest_')) {
      const user = await prisma.user.findUnique({
        where: { userId: member.userId },
        select: { avatar: true },
      });
      return { ...member, avatar: user?.avatar || null };
    }

    return { ...member, avatar: null };
  }

  /**
   * Find member by event ID and user ID
   */
  async findByEventIdAndUserId(eventId: number, userId: string) {
    return prisma.member.findFirst({
      where: {
        eventId,
        userId,
      },
    });
  }

  /**
   * Find all members by event ID with user avatars
   */
  async findByEventId(eventId: number) {
    const members = await prisma.member.findMany({
      where: { eventId },
      orderBy: { id: 'asc' },
    });

    // Fetch avatars for non-guest members
    const membersWithAvatars = await Promise.all(
      members.map(async (member) => {
        if (member.userId && !member.userId.startsWith('guest_')) {
          const user = await prisma.user.findUnique({
            where: { userId: member.userId },
            select: { avatar: true },
          });
          return { ...member, avatar: user?.avatar || null };
        }
        return { ...member, avatar: null };
      })
    );

    return membersWithAvatars;
  }

  /**
   * Find members with location by event ID
   */
  async findWithLocationByEventId(eventId: number) {
    return prisma.member.findMany({
      where: {
        eventId,
        lat: { not: null },
        lng: { not: null },
      },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Create member
   */
  async create(data: {
    eventId: number;
    userId?: string | null;
    nickname?: string | null;
    lat?: number | null;
    lng?: number | null;
    address?: string | null;
    travelMode?: string | null;
    shareLocation?: boolean;
  }) {
    return prisma.member.create({
      data: {
        eventId: data.eventId,
        userId: data.userId,
        nickname: data.nickname,
        lat: data.lat,
        lng: data.lng,
        address: data.address,
        travelMode: data.travelMode || 'driving',
        shareLocation: data.shareLocation || false,
      },
      include: {
        event: true,
      },
    });
  }

  /**
   * Update member location
   */
  async updateLocation(id: number, data: {
    lat?: number | null;
    lng?: number | null;
    address?: string | null;
    travelMode?: string | null;
  }) {
    return prisma.member.update({
      where: { id },
      data: {
        lat: data.lat,
        lng: data.lng,
        address: data.address,
        travelMode: data.travelMode,
        updatedAt: new Date(),
      },
      include: {
        event: true,
      },
    });
  }

  /**
   * Update member arrival time
   */
  async updateArrivalTime(id: number, arrivalTime: Date) {
    return prisma.member.update({
      where: { id },
      data: {
        arrivalTime,
        updatedAt: new Date(),
      },
      include: {
        event: true,
      },
    });
  }

  /**
   * Delete member
   */
  async delete(id: number) {
    return prisma.member.delete({
      where: { id },
    });
  }

  /**
   * Check if user is member of event
   */
  async isMemberOfEvent(eventId: number, userId: string): Promise<boolean> {
    const member = await prisma.member.findFirst({
      where: {
        eventId,
        userId,
      },
    });
    return !!member;
  }
}

export const memberRepository = new MemberRepository();

