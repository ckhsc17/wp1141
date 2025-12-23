import { memberRepository } from '../repositories/MemberRepository';
import { eventRepository } from '../repositories/EventRepository';
import { eventService } from './EventService';
import { etaService } from './ETAService';
import { triggerEventChannel } from '../lib/pusher';
import { getAnonymousUserId } from '../lib/userUtils';
import { TravelMode } from '../config/eta';

export class MemberService {
  /**
   * Join event as guest
   */
  async joinEventAsGuest(
    eventId: number,
    data: {
      nickname: string;
      shareLocation: boolean;
      travelMode?: string;
    }
  ) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Generate guest identifier
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const member = await memberRepository.create({
      eventId,
      userId: guestId, // Use guestId as userId for guests
      nickname: data.nickname,
      shareLocation: data.shareLocation,
      travelMode: data.travelMode || 'driving',
    });

    return member;
  }

  /**
   * Update member location
   */
  async updateLocation(
    memberId: number,
    data: {
      lat: number;
      lng: number;
      address?: string;
      travelMode?: string;
    }
  ) {
    const member = await memberRepository.findById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (!member.eventId) {
      throw new Error('Member eventId is missing');
    }

    const event = await eventRepository.findById(member.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if within time window
    if (!eventService.isWithinTimeWindow(event)) {
      throw new Error('Location updates are only allowed within the event time window');
    }

    const updatedMember = await memberRepository.updateLocation(memberId, {
      lat: data.lat,
      lng: data.lng,
      address: data.address,
      travelMode: data.travelMode,
    });

    // Trigger Pusher event for location update
    triggerEventChannel(event.id, 'location-update', {
      memberId: updatedMember.id,
      nickname: updatedMember.nickname || updatedMember.userId || 'Unknown',
      lat: updatedMember.lat,
      lng: updatedMember.lng,
      timestamp: new Date().toISOString(),
    });

    // Calculate and broadcast ETA update (if event has meeting point)
    if (event.meetingPointLat && event.meetingPointLng && updatedMember.shareLocation) {
      const travelMode = (updatedMember.travelMode || 'driving') as TravelMode;
      const nickname = updatedMember.nickname || updatedMember.userId || 'Unknown';
      
      console.log('[MemberService] Calling ETA service for location update:', {
        memberId: updatedMember.id,
        eventId: event.id,
        lat: data.lat,
        lng: data.lng,
        travelMode,
        meetingPoint: `${event.meetingPointLat},${event.meetingPointLng}`,
      });
      
      // ETAService will handle movement detection, throttling, and Pusher broadcast
      await etaService.handleLocationUpdate(
        updatedMember.id,
        event.id,
        data.lat,
        data.lng,
        travelMode,
        event.meetingPointLat,
        event.meetingPointLng,
        nickname
      );
    } else {
      console.log('[MemberService] Skipping ETA calculation:', {
        memberId: updatedMember.id,
        hasMeetingPoint: !!(event.meetingPointLat && event.meetingPointLng),
        shareLocation: updatedMember.shareLocation,
      });
    }

    return updatedMember;
  }

  /**
   * Mark member arrival
   */
  async markArrival(memberId: number) {
    const member = await memberRepository.findById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (!member.eventId) {
      throw new Error('Member eventId is missing');
    }

    const event = await eventRepository.findById(member.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const arrivalTime = new Date();
    const arrivalStatus = eventService.calculateArrivalStatus(event, arrivalTime);

    const updatedMember = await memberRepository.updateArrivalTime(memberId, arrivalTime);

    // Clear ETA state for this member (no longer needed)
    etaService.clearMemberState(memberId);

    // Trigger Pusher event
    triggerEventChannel(event.id, 'member-arrived', {
      memberId: updatedMember.id,
      nickname: updatedMember.nickname || updatedMember.userId || 'Unknown',
      arrivalTime: arrivalTime.toISOString(),
      status: arrivalStatus.status,
    });

    return {
      success: true,
      arrivalTime,
      status: arrivalStatus.status,
      lateMinutes: arrivalStatus.lateMinutes,
    };
  }

  /**
   * Check if member can update location (within time window)
   */
  async canUpdateLocation(memberId: number): Promise<boolean> {
    const member = await memberRepository.findById(memberId);
    if (!member) {
      return false;
    }

    if (!member.eventId) {
      return false;
    }

    const event = await eventRepository.findById(member.eventId);
    if (!event) {
      return false;
    }

    return eventService.isWithinTimeWindow(event);
  }
}

export const memberService = new MemberService();

