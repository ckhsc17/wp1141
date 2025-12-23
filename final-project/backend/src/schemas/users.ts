import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
  defaultLat: z.number().min(-90).max(90).optional().nullable(),
  defaultLng: z.number().min(-180).max(180).optional().nullable(),
  defaultAddress: z.string().max(500).optional().nullable(),
  defaultLocationName: z.string().max(200).optional().nullable(),
  defaultTravelMode: z.enum(['driving', 'transit', 'walking', 'bicycling', 'motorcycle']).optional().nullable(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

export const checkUserIdAvailableSchema = z.object({
  userId: z.string()
    .min(3, 'User ID must be at least 3 characters')
    .max(50, 'User ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'User ID can only contain letters, numbers, and underscores'),
});

export type CheckUserIdAvailableRequest = z.infer<typeof checkUserIdAvailableSchema>;

export const completeSetupSchema = z.object({
  userId: z.string()
    .min(3, 'User ID must be at least 3 characters')
    .max(50, 'User ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'User ID can only contain letters, numbers, and underscores'),
  defaultLat: z.number().min(-90).max(90).nullable().optional(),
  defaultLng: z.number().min(-180).max(180).nullable().optional(),
  defaultAddress: z.string().max(500).nullable().optional(),
  defaultLocationName: z.string().max(200).nullable().optional(),
  defaultTravelMode: z.enum(['driving', 'transit', 'walking', 'bicycling']).nullable().optional(),
});

export type CompleteSetupRequest = z.infer<typeof completeSetupSchema>;

