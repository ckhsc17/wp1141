import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class ChatService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  private async extractSearchKeywords(query: string): Promise<string[]> {
    const response = await this.gemini.generate({
      template: 'extractSearchKeywords',
      payload: { query },
    });

    let keywords: string[] = [];

    try {
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as { keywords: string[] | null };
      const cleaned = nullToUndefined(parsed);
      keywords = cleaned.keywords || [];
    } catch (error) {
      logger.warn('Failed to parse search keywords, using fallback', {
        query,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback: use query as keyword
      keywords = [query];
    }

    return keywords;
  }

  async searchHistory(userId: string, query: string): Promise<string> {
    // Extract tags and keywords
    const keywords = await this.extractSearchKeywords(query);
    
    // Try to extract tags if query involves specific topics
    const lowerQuery = query.toLowerCase();
    const potentialTags: string[] = [];
    if (lowerQuery.includes('生活') || lowerQuery.includes('life')) potentialTags.push('life');
    if (lowerQuery.includes('知識') || lowerQuery.includes('knowledge')) potentialTags.push('knowledge');
    if (lowerQuery.includes('靈感') || lowerQuery.includes('insight')) potentialTags.push('insight');
    if (lowerQuery.includes('記憶') || lowerQuery.includes('memory')) potentialTags.push('memory');
    if (lowerQuery.includes('音樂') || lowerQuery.includes('music')) potentialTags.push('music');

    // Mixed query: search by tags and keywords
    const tagResults = potentialTags.length > 0
      ? await this.savedItemRepo.searchByTags(userId, potentialTags, 5)
      : [];
    
    const textResults = await Promise.all(
      keywords.map((keyword) => this.savedItemRepo.searchByText(userId, keyword, 3))
    );
    const textResultsFlat = Array.from(new Set(textResults.flat().map((item) => item.id)))
      .map((id) => textResults.flat().find((item) => item.id === id)!)
      .slice(0, 5);

    // Combine and deduplicate results
    const allResults = [...tagResults, ...textResultsFlat];
    const uniqueResults = Array.from(
      new Map(allResults.map((item) => [item.id, item])).values()
    ).slice(0, 10);

    if (uniqueResults.length === 0) {
      return '我找不到相關的對話紀錄呢 😅 試試看用不同的關鍵字搜尋？';
    }

    // Format items for RAG context
    const itemsText = uniqueResults
      .map((item, idx) => `${idx + 1}. ${item.title || item.content}${item.url ? ` (${item.url})` : ''}${item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : ''}`)
      .join('\n');

    const response = await this.gemini.generate({
      template: 'answerChatHistoryWithRAG',
      payload: { query, items: itemsText },
    });

    logger.debug('Chat history searched with RAG', {
      userId,
      query,
      keywords,
      potentialTags,
      resultsCount: uniqueResults.length,
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }

  async chat(userId: string, text: string): Promise<string> {
    // Get recent context for better chat experience
    const recentItems = await this.savedItemRepo.listByUser(userId, 3);
    const context = recentItems.length > 0
      ? `最近記錄：${recentItems.map((i) => i.title || i.content).join('、')}`
      : undefined;

    const response = await this.gemini.generate({
      template: 'chat',
      payload: { text, context },
    });

    logger.debug('Chat response generated', {
      userId,
      textPreview: text.slice(0, 100),
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }
}

