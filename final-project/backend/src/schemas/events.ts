import { z } from 'zod';

// Helper function to validate and parse dates
const dateSchema = z.union([
  z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format. Use ISO 8601 format (e.g., 2025-12-01T19:00:00Z)' }
  ).transform((val) => new Date(val)),
  z.coerce.date({ invalid_type_error: 'Invalid date format' })
]);

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name must be less than 100 characters'),
  startTime: dateSchema.optional(), // Optional: defaults to 1 hour from now
  endTime: dateSchema.optional(), // Optional: defaults to 3 hours from now
  ownerId: z.string().min(1, 'Owner ID is required').optional(), // Optional: will be auto-filled from JWT if authenticated
  useMeetHalf: z.boolean().default(false),
  status: z.enum(['upcoming', 'ongoing', 'ended']).optional(),
  meetingPointLat: z.number().optional().nullable(),
  meetingPointLng: z.number().optional().nullable(),
  meetingPointName: z.string().optional().nullable(),
  meetingPointAddress: z.string().optional().nullable(),
  groupId: z.number().int().positive().optional().nullable(),
  // 主辦加入活動的信息（可選，如果提供則自動創建 member）
  ownerNickname: z.string().min(1, 'Owner nickname is required').max(100).optional(),
  ownerTravelMode: z.enum(['driving', 'transit', 'walking', 'bicycling', 'motorcycle']).optional(),
  ownerShareLocation: z.boolean().default(false).optional(),
  // 邀請好友列表（可選）
  invitedFriendIds: z.array(z.string().min(1, 'User ID is required')).optional(),
}).refine(
  (data) => {
    // Only validate if both times are provided
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  }
);


export const updateEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name must be less than 100 characters').optional(),
  startTime: dateSchema.optional(),
  endTime: dateSchema.optional(),
  meetingPointLat: z.number().optional().nullable(),
  meetingPointLng: z.number().optional().nullable(),
  meetingPointName: z.string().optional().nullable(),
  meetingPointAddress: z.string().optional().nullable(),
}).refine(
  (data) => {
    // Only validate if both times are provided
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  }
).refine(
  (data) => {
    // If any location field is provided, all location fields should be provided
    const hasAnyLocation = data.meetingPointLat !== undefined || 
                          data.meetingPointLng !== undefined || 
                          data.meetingPointName !== undefined || 
                          data.meetingPointAddress !== undefined;
    
    if (hasAnyLocation) {
      return data.meetingPointLat !== undefined && 
             data.meetingPointLng !== undefined && 
             data.meetingPointName !== undefined;
    }
    return true;
  },
  {
    message: 'If providing location, meetingPointLat, meetingPointLng, and meetingPointName are required',
    path: ['meetingPointLat'],
  }
);

export const eventParamsSchema = z.object({
  id: z.coerce.number().int().positive('Event ID must be a positive integer'),
});

export const timeMidpointQuerySchema = z.object({
  objective: z.enum(['minimize_total', 'minimize_max']).default('minimize_total')
});

export type CreateEventRequest = z.infer<typeof createEventSchema>;
export type UpdateEventRequest = z.infer<typeof updateEventSchema>;
export type EventParams = z.infer<typeof eventParamsSchema>;
export type TimeMidpointQuery = z.infer<typeof timeMidpointQuerySchema>;

