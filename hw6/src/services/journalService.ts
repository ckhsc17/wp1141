import type { JournalRepository } from '@/repositories';
import { JournalEntrySchema, type JournalEntry } from '@/domain/schemas';
import { logger } from '@/utils/logger';

export class JournalService {
  constructor(private readonly journalRepo: JournalRepository) {}

  async saveEntry(userId: string, content: string): Promise<JournalEntry> {
    const entry = await this.journalRepo.create({
      userId,
      content,
    });

    logger.info('Journal entry saved', { userId, entryId: entry.id });

    return JournalEntrySchema.parse(entry);
  }

  async listRecent(userId: string, limit = 10): Promise<JournalEntry[]> {
    const entries = await this.journalRepo.listByUser(userId, limit);
    return entries.map((entry) => JournalEntrySchema.parse(entry));
  }
}

