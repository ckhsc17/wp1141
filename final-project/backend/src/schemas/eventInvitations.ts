import { z } from 'zod';

export const createInvitationsSchema = z.object({
  invitedUserIds: z.array(z.string().min(1, 'User ID is required')).min(1, 'At least one user must be invited'),
});

export const invitationIdSchema = z.object({
  invitationId: z.coerce.number().int().positive('Invitation ID must be a positive integer'),
});

export const eventIdSchema = z.object({
  id: z.coerce.number().int().positive('Event ID must be a positive integer'),
});

export type CreateInvitationsRequest = z.infer<typeof createInvitationsSchema>;
export type InvitationIdParams = z.infer<typeof invitationIdSchema>;
export type EventIdParams = z.infer<typeof eventIdSchema>;

