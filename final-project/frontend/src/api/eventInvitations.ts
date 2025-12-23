import api from './axios';
import { EventInvitation, CreateInvitationsRequest, CreateInvitationsResponse } from '../types/eventInvitation';

export const eventInvitationsApi = {
  // Create invitations for an event
  createInvitations: async (
    eventId: number,
    data: CreateInvitationsRequest
  ): Promise<CreateInvitationsResponse> => {
    const response = await api.post(`/events/${eventId}/invitations`, data);
    return response.data;
  },

  // Accept an invitation
  acceptInvitation: async (eventId: number, invitationId: number): Promise<{ success: boolean }> => {
    const response = await api.post(`/events/${eventId}/invitations/${invitationId}/accept`);
    return response.data;
  },

  // Reject an invitation
  rejectInvitation: async (eventId: number, invitationId: number): Promise<{ success: boolean }> => {
    const response = await api.post(`/events/${eventId}/invitations/${invitationId}/reject`);
    return response.data;
  },
};

