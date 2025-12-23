import { pokeRecordRepository } from '../repositories/PokeRecordRepository';
import { memberRepository } from '../repositories/MemberRepository';
import { eventRepository } from '../repositories/EventRepository';
import { triggerEventChannel } from '../lib/pusher';
import { sendPushNotification } from '../lib/pusherBeams';

const MAX_POKES_PER_PAIR = 3;

export class PokeService {
  /**
   * Poke a member
   */
  async pokeMember(eventId: number, fromMemberId: number, toMemberId: number) {
    // Validate members exist and belong to the same event
    const fromMember = await memberRepository.findById(fromMemberId);
    const toMember = await memberRepository.findById(toMemberId);

    if (!fromMember || !toMember) {
      throw new Error('Member not found');
    }

    if (fromMember.eventId !== eventId || toMember.eventId !== eventId) {
      throw new Error('Members do not belong to the same event');
    }

    if (fromMemberId === toMemberId) {
      throw new Error('Cannot poke yourself');
    }

    // Check poke limit
    const pokeCount = await pokeRecordRepository.countPokes(eventId, fromMemberId, toMemberId);
    if (pokeCount >= MAX_POKES_PER_PAIR) {
      throw new Error(`Poke limit exceeded (max ${MAX_POKES_PER_PAIR} pokes per pair)`);
    }

    // Create poke record
    const pokeRecord = await pokeRecordRepository.create({
      eventId,
      fromMemberId,
      toMemberId,
    });

    // Get total pokes for the target member
    const totalPokes = await pokeRecordRepository.countPokes(eventId, fromMemberId, toMemberId);

    const pokeData = {
      fromMemberId,
      fromNickname: fromMember.nickname || fromMember.userId || 'Unknown',
      toMemberId,
      toNickname: toMember.nickname || toMember.userId || 'Unknown',
      count: totalPokes,
    };

    console.log('[PokeService] Poke record created, triggering Pusher event:', {
      eventId,
      pokeData,
      timestamp: new Date().toISOString(),
    });

    // Trigger Pusher event
    triggerEventChannel(eventId, 'poke', pokeData);

    // Send Push notification via Pusher Beams
    // Use device interest format: event-{eventId}-member-{toMemberId}
    const deviceInterest = `event-${eventId}-member-${toMemberId}`;
    const notificationTitle = '有人戳了你！';
    const notificationBody = totalPokes > 1
      ? `${pokeData.fromNickname} 戳了你 (${totalPokes} 次)`
      : `${pokeData.fromNickname} 戳了你`;

    sendPushNotification(deviceInterest, notificationTitle, notificationBody, {
      eventId: eventId.toString(),
      url: `/events/${eventId}`,
      type: 'poke',
      fromNickname: pokeData.fromNickname,
      count: totalPokes.toString(),
    }).catch((error) => {
      // Log error but don't fail the poke operation
      console.error('[PokeService] Failed to send push notification:', error);
    });

    console.log('[PokeService] Poke completed:', {
      eventId,
      fromMemberId,
      toMemberId,
      totalPokes,
    });

    return {
      success: true,
      pokeCount: totalPokes,
      totalPokes,
    };
  }

  /**
   * Get poke statistics for an event
   */
  async getPokeStats(eventId: number) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const stats = await pokeRecordRepository.getPokeStats(eventId);
    const members = await memberRepository.findByEventId(eventId);

    // Map member IDs to nicknames
    const memberMap = new Map(members.map((m) => [m.id, m.nickname || m.userId || 'Unknown']));

    return {
      mostPoked: stats.mostPoked
        ? {
            nickname: memberMap.get(stats.mostPoked.memberId) || 'Unknown',
            count: stats.mostPoked.count,
          }
        : null,
      mostPoker: stats.mostPoker
        ? {
            nickname: memberMap.get(stats.mostPoker.memberId) || 'Unknown',
            count: stats.mostPoker.count,
          }
        : null,
      totalPokes: stats.totalPokes,
    };
  }
}

export const pokeService = new PokeService();

