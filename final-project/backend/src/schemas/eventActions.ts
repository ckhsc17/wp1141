import { z } from 'zod';

const travelModes = ['driving', 'transit', 'walking', 'bicycling', 'motorcycle'] as const;

/**
 * Schema for joining an event as guest
 */
export const joinEventSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required').max(100, 'Nickname must be less than 100 characters'),
  shareLocation: z.boolean().default(false),
  travelMode: z.enum(travelModes).optional(),
});

/**
 * Schema for updating location
 */
export const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  address: z.string().max(255).optional(),
  travelMode: z.enum(travelModes).optional(),
});

/**
 * Schema for poking a member
 */
export const pokeMemberSchema = z.object({
  targetMemberId: z.number().int().positive('Target member ID must be a positive integer'),
});

/**
 * Schema for querying my events
 */
export const myEventsQuerySchema = z.object({
  status: z.enum(['upcoming', 'ongoing', 'ended', 'all']).default('all'),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type JoinEventRequest = z.infer<typeof joinEventSchema>;
export type UpdateLocationRequest = z.infer<typeof updateLocationSchema>;
export type PokeMemberRequest = z.infer<typeof pokeMemberSchema>;
export type MyEventsQuery = z.infer<typeof myEventsQuerySchema>;

