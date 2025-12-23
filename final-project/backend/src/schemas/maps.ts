import { z } from 'zod';

/**
 * Validation schema for GET /maps/geocode
 */
export const geocodeQuerySchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
});

/**
 * Validation schema for GET /maps/reverse
 */
export const reverseQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * Validation schema for GET /maps/nearby
 */
export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(5000).default(1500),
  type: z.string().optional(),
  keyword: z.string().optional(),
});

/**
 * Validation schema for POST /maps/directions
 */
export const directionsBodySchema = z.object({
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('transit'),
  departureTime: z.union([z.literal('now'), z.string().datetime()]).default('now'),
});


