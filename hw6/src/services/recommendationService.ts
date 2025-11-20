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

    // RAG query: combine tags search and text search for better relevance
    // 1. Search by tags (broader match)
    const tagResults = await this.savedItemRepo.searchByTags(userId, tags, 5);
    
    // 2. Search by text (more specific match, extract keywords from query)
    const keywords = query
      .split(/\s+/)
      .filter((word) => word.length > 1 && !['的', '是', '誰', '什麼', '可以', '推薦'].includes(word))
      .slice(0, 3);
    
    const textResults = keywords.length > 0
      ? await Promise.all(keywords.map((keyword) => this.savedItemRepo.searchByText(userId, keyword, 3)))
      : [];
    const textResultsFlat = Array.from(new Set(textResults.flat().map((item) => item.id)))
      .map((id) => textResults.flat().find((item) => item.id === id)!)
      .slice(0, 5);

    // 3. Combine and deduplicate results (prioritize text search results)
    const allResults = [...textResultsFlat, ...tagResults];
    const uniqueResults = Array.from(
      new Map(allResults.map((item) => [item.id, item])).values()
    ).slice(0, 10);

    if (uniqueResults.length === 0) {
      return '你還沒有儲存相關內容呢！分享一些你感興趣的內容，我會根據你的喜好提供推薦 ✨';
    }

    // Format items for RAG context
    const itemsText = uniqueResults
      .map((item) => `- ${item.title || item.content.slice(0, 100)}${item.url ? ` (${item.url})` : ''}${item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : ''}`)
      .join('\n');

    const response = await this.gemini.generate({
      template: 'generateRecommendationWithRAG',
      payload: { query, items: itemsText },
    });

    logger.debug('Recommendation generated with RAG', {
      userId,
      query,
      tags,
      keywords,
      itemsCount: uniqueResults.length,
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }
}

