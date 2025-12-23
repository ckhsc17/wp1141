import { z } from 'zod';

export const getNotificationsSchema = z.object({
  read: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const notificationIdSchema = z.object({
  id: z.coerce.number().int().positive('Notification ID must be a positive integer'),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsSchema>;
export type NotificationIdParams = z.infer<typeof notificationIdSchema>;

