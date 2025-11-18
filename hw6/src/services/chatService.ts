import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { logger } from '@/utils/logger';

export class ChatService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async searchHistory(userId: string, query: string): Promise<string> {
    // Search in saved items (including chat history stored as SavedItem with sourceType: 'chat')
    const results = await this.savedItemRepo.searchByText(userId, query, 10);

    if (results.length === 0) {
      return '我找不到相關的對話紀錄呢 😅 試試看用不同的關鍵字搜尋？';
    }

    const history = results
      .map((item, idx) => `${idx + 1}. ${item.title || item.content}${item.url ? ` (${item.url})` : ''}`)
      .join('\n');

    const response = await this.gemini.generate({
      template: 'searchChatHistory',
      payload: { query, history },
    });

    logger.debug('Chat history searched', {
      userId,
      query,
      resultsCount: results.length,
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

