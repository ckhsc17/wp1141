import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class FeedbackService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  private async extractFeedbackTags(query: string): Promise<string[]> {
    const response = await this.gemini.generate({
      template: 'extractFeedbackTags',
      payload: { query },
    });

    let tags: string[] = ['life'];

    try {
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as { tags: string[] | null };
      const cleaned = nullToUndefined(parsed);
      tags = cleaned.tags || tags;
    } catch (error) {
      logger.warn('Failed to parse feedback tags, using fallback', {
        query,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Ensure tags are lowercase
    return tags.map((tag) => tag.toLowerCase());
  }

  async generateFeedback(userId: string, context?: string): Promise<string> {
    // Extract tags from query
    const query = context || '生活回饋';
    const tags = await this.extractFeedbackTags(query);

    // RAG query: search by tags
    const relevantItems = await this.savedItemRepo.searchByTags(userId, tags, 10);

    if (relevantItems.length === 0) {
      return '你還沒有記錄任何內容呢！開始記錄你的生活點滴，我會根據你的紀錄提供回饋和建議 💫';
    }

    // Format items for RAG context
    const itemsText = relevantItems
      .map((item) => `- ${item.title || item.content}${item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : ''}`)
      .join('\n');

    const response = await this.gemini.generate({
      template: 'generateFeedbackWithRAG',
      payload: { query, items: itemsText },
    });

    logger.debug('Feedback generated with RAG', {
      userId,
      tags,
      itemsCount: relevantItems.length,
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }
}

