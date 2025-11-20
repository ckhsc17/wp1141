import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class RecommendationService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  private async extractTagsFromQuery(query: string): Promise<string[]> {
    const response = await this.gemini.generate({
      template: 'extractRecommendationTags',
      payload: { query },
    });

    let tags: string[] = ['recommendation'];

    try {
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as { tags: string[] | null };
      const cleaned = nullToUndefined(parsed);
      tags = cleaned.tags || tags;
    } catch (error) {
      logger.warn('Failed to parse recommendation tags, using fallback', {
        query,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Ensure tags are lowercase
    return tags.map((tag) => tag.toLowerCase());
  }

  async generateRecommendation(userId: string, context?: string): Promise<string> {
    // Extract tags from query
    const query = context || '';
    const tags = await this.extractTagsFromQuery(query);

    // RAG query: search by tags
    const relevantItems = await this.savedItemRepo.searchByTags(userId, tags, 10);

    if (relevantItems.length === 0) {
      return '你還沒有儲存相關內容呢！分享一些你感興趣的內容，我會根據你的喜好提供推薦 ✨';
    }

    // Format items for RAG context
    const itemsText = relevantItems
      .map((item) => `- ${item.title || item.content}${item.url ? ` (${item.url})` : ''}${item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : ''}`)
      .join('\n');

    const response = await this.gemini.generate({
      template: 'generateRecommendationWithRAG',
      payload: { query, items: itemsText },
    });

    logger.debug('Recommendation generated with RAG', {
      userId,
      tags,
      itemsCount: relevantItems.length,
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }
}

