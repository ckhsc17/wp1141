import { z } from 'zod';

export const sendFriendRequestSchema = z.object({
  toUserId: z.string().min(1, 'Target user ID is required'),
});

export const friendRequestIdSchema = z.object({
  id: z.coerce.number().int().positive('Request ID must be a positive integer'),
});

export const friendIdSchema = z.object({
  friendId: z.string().min(1, 'Friend ID is required'),
});

export const searchUsersSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});

export const getFriendRequestsSchema = z.object({
  type: z.enum(['received', 'sent']).default('received'),
});

export type SendFriendRequestRequest = z.infer<typeof sendFriendRequestSchema>;
export type FriendRequestIdParams = z.infer<typeof friendRequestIdSchema>;
export type FriendIdParams = z.infer<typeof friendIdSchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersSchema>;
export type GetFriendRequestsQuery = z.infer<typeof getFriendRequestsSchema>;

