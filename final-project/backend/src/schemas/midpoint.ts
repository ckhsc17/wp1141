import { z } from 'zod';

export const calculateMidpointSchema = z.object({
  locations: z.array(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      travelMode: z.enum(['driving', 'transit', 'walking', 'bicycling', 'motorcycle']).default('transit'),
    })
  ).min(2, 'At least 2 locations are required'),
  useMeetHalf: z.boolean().default(true),
});

export type CalculateMidpointRequest = z.infer<typeof calculateMidpointSchema>;

