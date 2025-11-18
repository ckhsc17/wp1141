import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { logger } from '@/utils/logger';

export class RecommendationService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async generateRecommendation(userId: string, context?: string): Promise<string> {
    // Get saved links
    const links = await this.savedItemRepo.listByUser(userId, 10);
    const linkSummaries = links
      .filter((item) => item.url)
      .map((item) => `- ${item.title || item.content} (${item.url})`)
      .join('\n');

    if (!linkSummaries.trim()) {
      return '你還沒有儲存任何連結呢！分享一些你感興趣的連結，我會根據你的喜好提供推薦 ✨';
    }

    const response = await this.gemini.generate({
      template: 'generateRecommendation',
      payload: { links: linkSummaries, context },
    });

    logger.debug('Recommendation generated', {
      userId,
      linksCount: links.length,
      context,
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }
}

