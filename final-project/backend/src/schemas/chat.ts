import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  receiverId: z.string().optional(),
  groupId: z.number().int().positive().optional(),
}).refine(
  (data) => {
    // Either receiverId or groupId must be provided, but not both
    return (data.receiverId && !data.groupId) || (!data.receiverId && data.groupId);
  },
  {
    message: 'Either receiverId or groupId must be provided (but not both)',
    path: ['receiverId'],
  }
);

export const getMessagesSchema = z.object({
  receiverId: z.string().optional(),
  groupId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
}).refine(
  (data) => {
    // Either receiverId or groupId must be provided, but not both
    return (data.receiverId && !data.groupId) || (!data.receiverId && data.groupId);
  },
  {
    message: 'Either receiverId or groupId must be provided (but not both)',
    path: ['receiverId'],
  }
);

export const markMessageReadSchema = z.object({
  id: z.coerce.number().int().positive('Message ID must be a positive integer'),
});

export const searchMessagesSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesSchema>;
export type MarkMessageReadParams = z.infer<typeof markMessageReadSchema>;
export type SearchMessagesQuery = z.infer<typeof searchMessagesSchema>;

