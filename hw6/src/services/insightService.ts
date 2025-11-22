import type { SavedItemRepository } from '@/repositories';
import { SavedItemSchema, type SavedItem } from '@/domain/schemas';
import { GeminiService } from './geminiService';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class InsightService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async saveInsight(userId: string, text: string): Promise<SavedItem> {
    // Use LLM to analyze insight content
    const response = await this.gemini.generate({
      template: 'analyzeInsight',
      payload: { text },
    });

    let summary = text.slice(0, 200);
    let tags: string[] = ['insight'];

    try {
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as { summary: string | null; tags: string[] | null };
      const cleaned = nullToUndefined(parsed);
      summary = cleaned.summary || summary;
      tags = cleaned.tags || tags;
    } catch (error) {
      logger.warn('Failed to parse insight analysis, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Ensure tags are lowercase
    tags = tags.map((tag) => tag.toLowerCase());

    const item = await this.savedItemRepo.create({
      userId,
      title: summary.slice(0, 200),
      content: text,
      tags,
    });

    logger.info('Insight saved', { userId, itemId: item.id, tags });

    return SavedItemSchema.parse(item);
  }
}


