import type { JournalRepository, SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { logger } from '@/utils/logger';

export class FeedbackService {
  constructor(
    private readonly journalRepo: JournalRepository,
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async generateFeedback(userId: string): Promise<string> {
    // Get recent journal entries and saved items
    const recentJournals = await this.journalRepo.listByUser(userId, 5);
    const recentItems = await this.savedItemRepo.listByUser(userId, 5);

    const entries = [
      ...recentJournals.map((j) => `[日記] ${j.content}`),
      ...recentItems.map((i) => `[${i.category}] ${i.title || i.content}`),
    ].join('\n');

    if (!entries.trim()) {
      return '你還沒有記錄任何內容呢！開始記錄你的生活點滴，我會根據你的紀錄提供回饋和建議 💫';
    }

    const response = await this.gemini.generate({
      template: 'generateFeedback',
      payload: { entries },
    });

    logger.debug('Feedback generated', {
      userId,
      entriesCount: recentJournals.length + recentItems.length,
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }
}

