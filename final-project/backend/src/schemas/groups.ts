import { z } from 'zod';

export const groupIdSchema = z.object({
  id: z.coerce.number().int().positive('Group ID must be a positive integer'),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name must be less than 100 characters'),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name must be less than 100 characters'),
});

export type GroupIdParams = z.infer<typeof groupIdSchema>;
export type CreateGroupRequest = z.infer<typeof createGroupSchema>;
export type UpdateGroupRequest = z.infer<typeof updateGroupSchema>;

