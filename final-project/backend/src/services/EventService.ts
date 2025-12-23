import { eventRepository } from '../repositories/EventRepository';
import { memberRepository } from '../repositories/MemberRepository';
import { triggerEventChannel } from '../lib/pusher';

export class EventService {
  /**
   * Check if current time is within event time window
   * Includes 30 minutes before startTime and 30 minutes after endTime
   */
  isWithinTimeWindow(event: { startTime: Date; endTime: Date }): boolean {
    const now = new Date();
    const TIME_WINDOW_BEFORE = 30 * 60 * 1000; // 30 minutes
    const TIME_WINDOW_AFTER = 30 * 60 * 1000; // 30 minutes
    
    const windowStart = new Date(event.startTime.getTime() - TIME_WINDOW_BEFORE);
    const windowEnd = new Date(event.endTime.getTime() + TIME_WINDOW_AFTER);
    
    return now >= windowStart && now <= windowEnd;
  }

  /**
   * Calculate arrival status (early, ontime, late)
   * Based on event startTime
   */
  calculateArrivalStatus(event: { startTime: Date }, arrivalTime: Date): {
    status: 'early' | 'ontime' | 'late';
    lateMinutes: number;
  } {
    // Ensure startTime is a Date object
    const eventStartTime = event.startTime instanceof Date 
      ? event.startTime 
      : new Date(event.startTime);
    const arrival = arrivalTime instanceof Date 
      ? arrivalTime 
      : new Date(arrivalTime);
    
    // Calculate difference in minutes from event start time
    const diffMinutes = (arrival.getTime() - eventStartTime.getTime()) / 1000 / 60;

    if (diffMinutes < 0) {
      return { status: 'early', lateMinutes: 0 };
    } else if (diffMinutes <= 5) {
      // Consider ontime if within 5 minutes
      return { status: 'ontime', lateMinutes: 0 };
    } else {
      return { status: 'late', lateMinutes: Math.round(diffMinutes) };
    }
  }

  /**
   * Update event status based on current time
   */
  async updateEventStatuses(): Promise<void> {
    await eventRepository.updateStatusByTime();
  }

  /**
   * Get event result (rankings)
   */
  async getEventResult(eventId: number) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const members = await memberRepository.findByEventId(eventId);

    // Calculate rankings
    const rankings: Array<{
      memberId: number;
      nickname: string;
      userId: string | null;
      avatar: string | null;
      arrivalTime: Date | null;
      status: 'early' | 'ontime' | 'late' | 'absent';
      lateMinutes: number | null;
      rank: number | null;
      pokeCount: number;
    }> = members
      .map((member: any) => {
        if (!member.arrivalTime) {
          return {
            memberId: member.id,
            nickname: member.nickname || member.userId || 'Unknown',
            userId: member.userId,
            avatar: member.avatar || null,
            arrivalTime: null,
            status: 'absent' as const,
            lateMinutes: null,
            rank: null as number | null,
            pokeCount: 0,
          };
        }

        const arrivalStatus = this.calculateArrivalStatus(event, member.arrivalTime);
        return {
          memberId: member.id,
          nickname: member.nickname || member.userId || 'Unknown',
          userId: member.userId,
          avatar: member.avatar || null,
          arrivalTime: member.arrivalTime,
          status: arrivalStatus.status,
          lateMinutes: arrivalStatus.lateMinutes,
          rank: null as number | null, // Will be calculated below
          pokeCount: 0, // Will be calculated below
        };
      })
      .sort((a, b) => {
        // Sort by arrival time (earliest first)
        if (!a.arrivalTime) return 1;
        if (!b.arrivalTime) return -1;
        return a.arrivalTime.getTime() - b.arrivalTime.getTime();
      });

    // Assign ranks
    let currentRank = 1;
    for (let i = 0; i < rankings.length; i++) {
      if (rankings[i].arrivalTime) {
        rankings[i].rank = currentRank;
        currentRank++;
      }
    }

    // Calculate poke counts
    const { pokeRecordRepository } = await import('../repositories/PokeRecordRepository');
    for (const ranking of rankings) {
      if (ranking.memberId) {
        const pokes = await pokeRecordRepository.getPokesForMember(eventId, ranking.memberId);
        ranking.pokeCount = pokes.length;
      }
    }

    // Get poke statistics (mostPoked, mostPoker, totalPokes)
    const pokeStats = await pokeRecordRepository.getPokeStats(eventId);
    const memberMap = new Map(members.map((m) => [m.id, m.nickname || m.userId || 'Unknown']));

    // Calculate stats
    const arrivedCount = rankings.filter((r) => r.arrivalTime !== null).length;
    const lateCount = rankings.filter((r) => r.status === 'late').length;
    const absentCount = rankings.filter((r) => r.status === 'absent').length;

    return {
      eventId,
      rankings,
      stats: {
        totalMembers: members.length,
        arrivedCount,
        lateCount,
        absentCount,
        totalPokes: pokeStats.totalPokes,
      },
      pokes: {
        mostPoked: pokeStats.mostPoked
          ? {
              nickname: memberMap.get(pokeStats.mostPoked.memberId) || 'Unknown',
              count: pokeStats.mostPoked.count,
            }
          : {
              nickname: '無',
              count: 0,
            },
        mostPoker: pokeStats.mostPoker
          ? {
              nickname: memberMap.get(pokeStats.mostPoker.memberId) || 'Unknown',
              count: pokeStats.mostPoker.count,
            }
          : {
              nickname: '無',
              count: 0,
            },
      },
    };
  }
}

export const eventService = new EventService();

