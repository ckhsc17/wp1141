
export enum EventStatus {
    UPCOMING = 'upcoming',
    ONGOING = 'ongoing',
    ENDED = 'ended',
  }
  
  export enum TravelMode {
    DRIVING = 'driving',
    TRANSIT = 'transit',
    WALKING = 'walking',
    BICYCLING = 'bicycling',
  }
  
  export interface User {
    id: number;
    userId: string;
    name: string;
    avatar?: string;
  }
  
  export interface Group {
    id: number;
    name: string;
    avatar: string;
    membersCount: number;
  }
  
  export interface Member {
    id: number;
    eventId: number;
    userId: string | null;
    nickname: string;
    lat: number | null;
    lng: number | null;
    travelMode: TravelMode;
    shareLocation: boolean;
    arrivalTime: Date | null;
    isCurrentUser?: boolean;
  }
  
  export interface PokeRecord {
    id: string;
    eventId: number;
    fromMemberId: number;
    toMemberId: number;
    createdAt: Date;
  }
  
  export interface Event {
    id: number;
    name: string;
    ownerName: string;
    meetingPointLat: number;
    meetingPointLng: number;
    meetingPointName: string;
    startTime: Date;
    endTime: Date;
    status: EventStatus;
    useMeetHalf: boolean;
    groupId?: number;
    members: Member[];
    pokeRecords: PokeRecord[];
  }
  
  export interface CreateEventDTO {
    name: string;
    ownerName: string;
    startTime: string;
    endTime: string;
    meetingPointName: string;
    groupId?: number;
  }
  
  export interface JoinEventDTO {
    nickname: string;
    travelMode: TravelMode;
    shareLocation: boolean;
  }
  