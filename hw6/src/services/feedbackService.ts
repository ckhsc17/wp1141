import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import type { IMemoryProvider } from './memory/IMemoryProvider';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class FeedbackService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
    private readonly memoryProvider: IMemoryProvider | null, // 使用抽象介面，可能為 null
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

    // Always include 'memory' tag for feedback to consider user's memories/diary entries
    const searchTags = [...tags, 'memory'];
    // Remove duplicates
    const uniqueTags = Array.from(new Set(searchTags));

    // 1. RAG query: search by tags (including memory) - SavedItem
    const relevantItems = await this.savedItemRepo.searchByTags(userId, uniqueTags, 10);

    // 2. 同時搜尋 Mem0 的記憶（包含提取的 preference、習慣等）
    let mem0Memories = '';
    if (this.memoryProvider) {
      // 不限制 categories，允許搜尋所有類型記憶（包括 other、save_content 等提取的偏好）
      mem0Memories = await this.memoryProvider.searchRelevantMemories(
        userId,
        query,
        5,
        undefined // 不限制 categories
      );
    }

    // 3. 合併 SavedItem 和 Mem0 記憶作為 context
    const itemsText = relevantItems
      .map((item) => `- ${item.title || item.content}${item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : ''}`)
      .join('\n');

    // 如果有 Mem0 記憶，加入 context
    const combinedContext = mem0Memories
      ? `${mem0Memories}\n\n用戶的記錄：\n${itemsText}`
      : itemsText;

    if (relevantItems.length === 0 && !mem0Memories) {
      return '你還沒有記錄任何內容呢！開始記錄你的生活點滴，我會根據你的紀錄提供回饋和建議 💫';
    }

    const response = await this.gemini.generate({
      template: 'generateFeedbackWithRAG',
      payload: { query, items: combinedContext },
    });

    logger.debug('Feedback generated with RAG', {
      userId,
      tags: uniqueTags,
      itemsCount: relevantItems.length,
      hasMem0Memories: !!mem0Memories,
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }
}

