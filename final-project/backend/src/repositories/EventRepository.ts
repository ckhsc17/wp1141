import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class EventRepository {
  /**
   * Find event by ID with members (including user avatars)
   */
  async findById(id: number) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: { id: 'asc' },
        },
        group: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (!event) return null;

    // Fetch avatars for non-guest members
    const membersWithAvatars = await Promise.all(
      event.members.map(async (member) => {
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

    return { ...event, members: membersWithAvatars };
  }

  /**
   * Find events by user ID (through members)
   */
  async findByUserId(userId: string, options?: {
    status?: 'upcoming' | 'ongoing' | 'ended' | 'all';
    limit?: number;
    offset?: number;
  }) {
    const { status = 'all', limit = 20, offset = 0 } = options || {};

    const where: Prisma.EventWhereInput = {
      members: {
        some: {
          userId,
        },
      },
    };

    if (status !== 'all') {
      where.status = status;
    }

    return prisma.event.findMany({
      where,
      include: {
        members: {
          orderBy: { id: 'asc' },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Count events by user ID
   */
  async countByUserId(userId: string, status?: 'upcoming' | 'ongoing' | 'ended' | 'all') {
    const where: Prisma.EventWhereInput = {
      members: {
        some: {
          userId,
        },
      },
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    return prisma.event.count({ where });
  }

  /**
   * Create event
   */
  async create(data: {
    name: string;
    ownerId: string;
    startTime: Date;
    endTime: Date;
    meetingPointLat?: number | null;
    meetingPointLng?: number | null;
    meetingPointName?: string | null;
    meetingPointAddress?: string | null;
    status?: 'upcoming' | 'ongoing' | 'ended';
    useMeetHalf?: boolean;
    groupId?: number | null;
    memberUserId?: string | null;
  }) {
    return prisma.event.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        startTime: data.startTime,
        endTime: data.endTime,
        meetingPointLat: data.meetingPointLat,
        meetingPointLng: data.meetingPointLng,
        meetingPointName: data.meetingPointName,
        meetingPointAddress: data.meetingPointAddress,
        status: data.status || 'upcoming',
        useMeetHalf: data.useMeetHalf || false,
        groupId: data.groupId,
        members: data.memberUserId
          ? {
              create: {
                userId: data.memberUserId,
              },
            }
          : undefined,
      },
      include: {
        members: {
          orderBy: { id: 'asc' },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  }

  /**
   * Update event
   */
  async update(id: number, data: Partial<{
    name: string;
    meetingPointLat: number | null;
    meetingPointLng: number | null;
    meetingPointName: string | null;
    meetingPointAddress: string | null;
    startTime: Date;
    endTime: Date;
    status: 'upcoming' | 'ongoing' | 'ended';
    useMeetHalf: boolean;
    groupId: number | null;
  }>) {
    return prisma.event.update({
      where: { id },
      data,
      include: {
        members: {
          orderBy: { id: 'asc' },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  }

  /**
   * Update event status based on time
   */
  async updateStatusByTime() {
    const now = new Date();

    // Update ongoing events
    await prisma.event.updateMany({
      where: {
        status: 'upcoming',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      data: {
        status: 'ongoing',
      },
    });

    // Update ended events
    await prisma.event.updateMany({
      where: {
        status: { in: ['upcoming', 'ongoing'] },
        endTime: { lt: now },
      },
      data: {
        status: 'ended',
      },
    });
  }

  /**
   * Delete event
   */
  async delete(id: number) {
    return prisma.event.delete({
      where: { id },
    });
  }
}

export const eventRepository = new EventRepository();

