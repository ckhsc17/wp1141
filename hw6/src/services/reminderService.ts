import { z } from 'zod';

import type { ReminderRepository } from '@/repositories';
import { ReminderSchema } from '@/domain/schemas';
import { ValidationError } from '@/utils/errors';

const ReminderInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  triggerAt: z.date(),
});

export type ReminderInput = z.infer<typeof ReminderInputSchema>;

export class ReminderService {
  constructor(private readonly reminderRepo: ReminderRepository) {}

  async createReminder(userId: string, payload: ReminderInput) {
    const result = ReminderInputSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError('Invalid reminder payload', { issues: result.error.issues });
    }

    const reminder = await this.reminderRepo.create({
      userId,
      title: result.data.title,
      description: result.data.description,
      triggerAt: result.data.triggerAt,
    });

    return ReminderSchema.parse(reminder);
  }

  async listPending(userId: string) {
    const reminders = await this.reminderRepo.listPending(userId);
    return reminders.map((reminder) => ReminderSchema.parse(reminder));
  }
}


