import { z } from 'zod';

const travelModes = ['driving', 'transit', 'walking', 'bicycling', 'motorcycle'] as const;

export const addMemberSchema = z.object({
  username: z.string().min(1, 'Username is required').max(255, 'Username must be less than 255 characters'),
  eventId: z.number().int().positive('Event ID must be a positive integer'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  address: z.string().max(255).optional(),
  travelMode: z.enum(travelModes).optional(),
});

export const updateMemberLocationSchema = z.object({
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
  address: z.string().max(255, 'Address must be less than 255 characters').optional(),
  travelMode: z.enum(travelModes).optional(),
});

export const memberParamsSchema = z.object({
  id: z.coerce.number().int().positive('Member ID must be a positive integer'),
});

// Schema for creating offline member
export const createOfflineMemberSchema = z.object({
  eventId: z.number().int().positive('Event ID must be a positive integer'),
  nickname: z.string().min(1, 'Nickname is required').max(100, 'Nickname must be less than 100 characters'),
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  address: z.string().max(255, 'Address must be less than 255 characters').optional(),
  travelMode: z.enum(travelModes).default('driving'),
});

// ✅ NEW: Schema for updating offline member
export const updateOfflineMemberSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required').max(100, 'Nickname must be less than 100 characters').optional(),
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
  address: z.string().max(255, 'Address must be less than 255 characters').optional(),
  travelMode: z.enum(travelModes).optional(),
});

export type AddMemberRequest = z.infer<typeof addMemberSchema>;
export type UpdateMemberLocationRequest = z.infer<typeof updateMemberLocationSchema>;
export type MemberParams = z.infer<typeof memberParamsSchema>;
export type CreateOfflineMemberRequest = z.infer<typeof createOfflineMemberSchema>;
export type UpdateOfflineMemberRequest = z.infer<typeof updateOfflineMemberSchema>;
