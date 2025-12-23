import prisma from '../lib/prisma';

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  /**
   * Find user by userId string
   */
  async findByUserId(userId: string) {
    return prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    // Get all events user participated in
    const events = await prisma.event.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
          include: {
            event: true,
          },
        },
      },
    });

    // Calculate statistics
    let totalEvents = events.length;
    let ontimeCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let totalLateMinutes = 0;
    let totalPokeReceived = 0;
    let totalPokeSent = 0;
    const ranks: number[] = [];

    for (const event of events) {
      const member = event.members[0];
      if (!member) continue;

      if (event.status === 'ended') {
        if (member.arrivalTime) {
          const arrivalTime = new Date(member.arrivalTime);
          const eventTime = new Date(event.startTime);
          const lateMinutes = Math.max(0, (arrivalTime.getTime() - eventTime.getTime()) / 1000 / 60);

          if (lateMinutes === 0) {
            ontimeCount++;
          } else {
            lateCount++;
            totalLateMinutes += lateMinutes;
          }
        } else {
          absentCount++;
        }

        // Calculate rank (simplified - would need full ranking logic)
        const allMembers = await prisma.member.findMany({
          where: { eventId: event.id },
          orderBy: { arrivalTime: 'asc' },
        });
        const rank = allMembers.findIndex((m) => m.id === member.id) + 1;
        if (rank > 0) ranks.push(rank);
      }

      // Count pokes
      const received = await prisma.pokeRecord.count({
        where: {
          eventId: event.id,
          toMemberId: member.id,
        },
      });
      const sent = await prisma.pokeRecord.count({
        where: {
          eventId: event.id,
          fromMemberId: member.id,
        },
      });
      totalPokeReceived += received;
      totalPokeSent += sent;
    }

    const avgLateMinutes = lateCount > 0 ? totalLateMinutes / lateCount : 0;
    const ontimeRate = totalEvents > 0 ? ontimeCount / totalEvents : 0;
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;
    const worstRank = ranks.length > 0 ? Math.max(...ranks) : null;

    return {
      totalEvents,
      ontimeCount,
      lateCount,
      absentCount,
      avgLateMinutes,
      totalPokeReceived,
      totalPokeSent,
      ontimeRate,
      bestRank,
      worstRank,
    };
  }
}

export const userRepository = new UserRepository();

