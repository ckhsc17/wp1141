import type { InsightRepository, SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { InsightSchema } from '@/domain/schemas';
import { logger } from '@/utils/logger';

export class InsightService {
  constructor(
    private readonly insightRepo: InsightRepository,
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async generateDailyInsight(userId: string) {
    const recentItems = await this.savedItemRepo.listByUser(userId, 5);
    const joined = recentItems.map((item) => `- ${item.title ?? ''} ${item.content}`).join('\n');

    const response = await this.gemini.generate({
      template: 'dailyInsight',
      payload: { entries: joined },
    });

    logger.debug('Generated daily insight from Gemini', {
      userId,
      entriesPreview: joined.slice(0, 200),
      responsePreview: response.slice(0, 200),
    });

    const insight = await this.insightRepo.create({
      userId,
      summary: response,
      actionItems: [],
      sentiment: 'neutral',
    });

    return InsightSchema.parse(insight);
  }

  async listRecent(userId: string) {
    const insights = await this.insightRepo.listRecent(userId);
    return insights.map((insight) => InsightSchema.parse(insight));
  }
}


