import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class PokeRecordRepository {
  /**
   * Create poke record
   */
  async create(data: {
    eventId: number;
    fromMemberId: number;
    toMemberId: number;
  }) {
    return prisma.pokeRecord.create({
      data: {
        eventId: data.eventId,
        fromMemberId: data.fromMemberId,
        toMemberId: data.toMemberId,
      },
    });
  }

  /**
   * Count pokes from a member to another member in an event
   */
  async countPokes(eventId: number, fromMemberId: number, toMemberId: number): Promise<number> {
    return prisma.pokeRecord.count({
      where: {
        eventId,
        fromMemberId,
        toMemberId,
      },
    });
  }

  /**
   * Get poke statistics for an event
   */
  async getPokeStats(eventId: number) {
    // Get all poke records for this event
    const pokes = await prisma.pokeRecord.findMany({
      where: { eventId },
      include: {
        event: {
          include: {
            members: true,
          },
        },
      },
    });

    // Count pokes received by each member
    const receivedCounts = new Map<number, number>();
    const sentCounts = new Map<number, number>();

    for (const poke of pokes) {
      // Count received
      const received = receivedCounts.get(poke.toMemberId) || 0;
      receivedCounts.set(poke.toMemberId, received + 1);

      // Count sent
      const sent = sentCounts.get(poke.fromMemberId) || 0;
      sentCounts.set(poke.fromMemberId, sent + 1);
    }

    // Find most poked member
    let mostPoked: { memberId: number; count: number } | null = null;
    for (const [memberId, count] of receivedCounts.entries()) {
      if (!mostPoked || count > mostPoked.count) {
        mostPoked = { memberId, count };
      }
    }

    // Find most poker member
    let mostPoker: { memberId: number; count: number } | null = null;
    for (const [memberId, count] of sentCounts.entries()) {
      if (!mostPoker || count > mostPoker.count) {
        mostPoker = { memberId, count };
      }
    }

    return {
      mostPoked,
      mostPoker,
      totalPokes: pokes.length,
    };
  }

  /**
   * Get poke records for a member
   */
  async getPokesForMember(eventId: number, memberId: number) {
    return prisma.pokeRecord.findMany({
      where: {
        eventId,
        toMemberId: memberId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const pokeRecordRepository = new PokeRecordRepository();

