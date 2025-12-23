
import { Event, Member, EventStatus, TravelMode, CreateEventDTO, JoinEventDTO, Group } from '../types';

const MOCK_EVENTS_KEY = 'meethalf_events';
const CURRENT_USER_ID_KEY = 'meethalf_current_user_id'; 

class MockDbService {
  private events: Event[] = [];
  private groups: Group[] = [
    { id: 101, name: "The Brunch Club", avatar: "🥞", membersCount: 5 },
    { id: 102, name: "Friday Night 🍺", avatar: "🍕", membersCount: 8 },
    { id: 103, name: "Hiking Gang", avatar: "🌲", membersCount: 4 }
  ];

  constructor() {
    this.loadFromStorage();
    if (this.events.length === 0) {
        this.seedData();
    }
  }

  private seedData() {
      const now = new Date();
      
      const ongoingEvent: Event = {
          id: 1,
          name: "Hotpot Party 🔥",
          ownerName: "Alice",
          meetingPointLat: 37.7879,
          meetingPointLng: -122.4075,
          meetingPointName: "Haidilao SF",
          startTime: new Date(now.getTime() - 1800000), // Started 30 mins ago
          endTime: new Date(now.getTime() + 7200000),
          status: EventStatus.ONGOING,
          useMeetHalf: false,
          groupId: 101,
          members: [
              { id: 1, eventId: 1, userId: 'u_alice', nickname: 'Alice', lat: 37.7879, lng: -122.4075, travelMode: TravelMode.WALKING, shareLocation: true, arrivalTime: new Date(now.getTime() - 900000) },
              { id: 2, eventId: 1, userId: 'u_bob', nickname: 'Bob', lat: 37.7840, lng: -122.4110, travelMode: TravelMode.DRIVING, shareLocation: true, arrivalTime: null },
              { id: 3, eventId: 1, userId: 'u_charlie', nickname: 'Charlie', lat: 37.7910, lng: -122.4030, travelMode: TravelMode.TRANSIT, shareLocation: true, arrivalTime: null }
          ],
          pokeRecords: []
      };

      const pastEvent: Event = {
          id: 2,
          name: "Board Games Night",
          ownerName: "Alice",
          meetingPointLat: 37.7749,
          meetingPointLng: -122.4194,
          meetingPointName: "Victory Point Cafe",
          startTime: new Date(now.getTime() - 86400000), // 1 day ago
          endTime: new Date(now.getTime() - 82800000),
          status: EventStatus.ENDED,
          useMeetHalf: false,
          groupId: 102,
          members: [
              { id: 4, eventId: 2, userId: 'u_alice', nickname: 'Alice', lat: 37.7749, lng: -122.4194, travelMode: TravelMode.WALKING, shareLocation: true, arrivalTime: new Date(now.getTime() - 86400000) },
              { id: 5, eventId: 2, userId: 'u_bob', nickname: 'Bob', lat: 37.7749, lng: -122.4194, travelMode: TravelMode.DRIVING, shareLocation: true, arrivalTime: new Date(now.getTime() - 86300000) }
          ],
          pokeRecords: []
      };

      this.events = [ongoingEvent, pastEvent];
      this.saveToStorage();
      localStorage.setItem(CURRENT_USER_ID_KEY, 'u_alice');
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(MOCK_EVENTS_KEY);
    if (stored) {
      this.events = JSON.parse(stored, (key, value) => {
        if (['startTime', 'endTime', 'arrivalTime', 'createdAt'].includes(key)) {
          return value ? new Date(value) : null;
        }
        return value;
      });
    }
  }

  private saveToStorage() {
    localStorage.setItem(MOCK_EVENTS_KEY, JSON.stringify(this.events));
  }

  async getGroups(): Promise<Group[]> {
    return this.groups;
  }

  async getAllEvents(): Promise<Event[]> {
    this.loadFromStorage();
    return this.events;
  }

  async createEvent(data: CreateEventDTO): Promise<Event> {
    const newEvent: Event = {
      id: Date.now(),
      name: data.name,
      ownerName: data.ownerName,
      meetingPointLat: 37.7879,
      meetingPointLng: -122.4075,
      meetingPointName: data.meetingPointName || 'Union Square',
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      status: EventStatus.UPCOMING,
      useMeetHalf: false,
      groupId: data.groupId,
      members: [],
      pokeRecords: []
    };
    
    const ownerMember: Member = {
        id: Date.now() + 1,
        eventId: newEvent.id,
        userId: this.getCurrentUserId(),
        nickname: data.ownerName,
        lat: null, 
        lng: null,
        travelMode: TravelMode.DRIVING,
        shareLocation: true,
        arrivalTime: null,
    };
    
    newEvent.members.push(ownerMember);
    this.events.unshift(newEvent);
    this.saveToStorage();
    return newEvent;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    this.loadFromStorage(); 
    return this.events.find(e => e.id === id);
  }

  async joinEvent(eventId: number, data: JoinEventDTO): Promise<Member> {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    const newMember: Member = {
      id: Date.now(),
      eventId,
      userId: 'guest_' + Date.now(),
      nickname: data.nickname,
      lat: event.meetingPointLat - 0.01 + (Math.random() * 0.005),
      lng: event.meetingPointLng - 0.01 + (Math.random() * 0.005),
      travelMode: data.travelMode,
      shareLocation: data.shareLocation,
      arrivalTime: null
    };

    event.members.push(newMember);
    this.saveToStorage();
    return newMember;
  }

  getCurrentUserId(): string {
    return localStorage.getItem(CURRENT_USER_ID_KEY) || 'u_alice';
  }

  async markArrived(eventId: number, memberId: number): Promise<void> {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;
    const member = event.members.find(m => m.id === memberId);
    if (member && !member.arrivalTime) {
      member.arrivalTime = new Date();
      member.lat = event.meetingPointLat; 
      member.lng = event.meetingPointLng;
      this.saveToStorage();
    }
  }

  async pokeMember(eventId: number, fromMemberId: number, toMemberId: number): Promise<boolean> {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return false;
    event.pokeRecords.push({ id: 'p_'+Date.now(), eventId, fromMemberId, toMemberId, createdAt: new Date() });
    this.saveToStorage();
    return true;
  }

  simulateOthersMovement(eventId: number) {
    const event = this.events.find(e => e.id === eventId);
    if (!event || event.status === EventStatus.ENDED) return;
    const currentUserId = this.getCurrentUserId();

    event.members.forEach(m => {
      if (m.userId === currentUserId || m.arrivalTime) return;
      if (!m.lat) {
          m.lat = event.meetingPointLat + (Math.random() - 0.5) * 0.01;
          m.lng = event.meetingPointLng + (Math.random() - 0.5) * 0.01;
      }
      m.lat += (event.meetingPointLat - m.lat) * 0.1;
      m.lng += (event.meetingPointLng - m.lng) * 0.1;
    });
    this.saveToStorage();
  }
}

export const mockDb = new MockDbService();
