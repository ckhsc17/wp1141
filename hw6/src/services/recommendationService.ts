import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import type { IMemoryProvider } from './memory/IMemoryProvider';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class RecommendationService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
    private readonly memoryProvider: IMemoryProvider | null, // 使用抽象介面，可能為 null
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
    // 1. Search by tags (broader match) - SavedItem
    const tagResults = await this.savedItemRepo.searchByTags(userId, tags, 5);
    
    // 2. Search by text (more specific match, extract keywords from query) - SavedItem
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

    // 3. Combine and deduplicate results (prioritize text search results) - SavedItem
    const allResults = [...textResultsFlat, ...tagResults];
    const uniqueResults = Array.from(
      new Map(allResults.map((item) => [item.id, item])).values()
    ).slice(0, 10);

    // 4. 同時搜尋 Mem0 的記憶（包含提取的 preference、興趣等）
    let mem0Memories = '';
    if (this.memoryProvider) {
      // 不限制 categories，允許搜尋所有類型記憶（包括 link、other、save_content 等提取的偏好）
      // 即使查詢為空，也搜索一般性的偏好記憶
      const searchQuery = query || '用戶偏好 興趣';
      mem0Memories = await this.memoryProvider.searchRelevantMemories(
        userId,
        searchQuery,
        10, // 增加數量，以便獲取更多偏好資訊
        undefined // 不限制 categories
      );
    }

    // 5. 如果沒有直接相關的 SavedItem，但有 Mem0 記憶（偏好），仍然可以生成推薦
    const hasSavedItems = uniqueResults.length > 0;
    const hasPreferences = !!mem0Memories;

    // 只有當兩者都沒有時，才說沒有內容
    if (!hasSavedItems && !hasPreferences) {
      return '你還沒有儲存相關內容呢！分享一些你感興趣的內容，我會根據你的喜好提供推薦 ✨';
    }

    // Format items for RAG context
    const itemsText = uniqueResults
      .map((item) => `- ${item.title || item.content.slice(0, 100)}${item.url ? ` (${item.url})` : ''}${item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : ''}`)
      .join('\n');

    // 組合 context：優先顯示偏好，然後是保存的內容
    let combinedContext = '';
    if (hasPreferences) {
      combinedContext = `用戶的偏好與興趣：\n${mem0Memories}`;
      if (hasSavedItems) {
        combinedContext += `\n\n用戶儲存的相關內容：\n${itemsText}`;
      }
    } else {
      combinedContext = itemsText;
    }

    const response = await this.gemini.generate({
      template: 'generateRecommendationWithRAG',
      payload: { query, items: combinedContext },
    });

    logger.debug('Recommendation generated with RAG', {
      userId,
      query,
      tags,
      keywords,
      itemsCount: uniqueResults.length,
      hasMem0Memories: !!mem0Memories,
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }
}

