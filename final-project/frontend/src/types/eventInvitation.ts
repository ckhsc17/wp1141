export interface EventInvitation {
  id: number;
  eventId: number;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  event?: {
    id: number;
    name: string;
    ownerId: string;
    groupId: number | null;
  };
}

export interface CreateInvitationsRequest {
  invitedUserIds: string[];
}

export interface CreateInvitationsResponse {
  invitations: EventInvitation[];
  errors?: Array<{
    userId: string;
    error: string;
  }>;
}

