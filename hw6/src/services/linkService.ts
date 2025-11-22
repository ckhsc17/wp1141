import type { SavedItemRepository } from '@/repositories';
import { LinkAnalysisSchema, SavedItemSchema, type LinkAnalysis, type SavedItem } from '@/domain/schemas';
import { GeminiService } from './geminiService';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class LinkService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async analyzeAndSave(userId: string, url: string, content?: string): Promise<{ item: SavedItem; analysis: LinkAnalysis }> {
    // Analyze link using LLM
    const response = await this.gemini.generate({
      template: 'analyzeLink',
      payload: { url, content },
    });

    let analysis: LinkAnalysis;

    try {
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as LinkAnalysis;
      // Convert null to undefined for optional fields
      const cleaned = nullToUndefined(parsed);
      analysis = LinkAnalysisSchema.parse(cleaned);
    } catch (error) {
      logger.warn('Failed to parse link analysis, using fallback', {
        userId,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      analysis = {
        type: '其他',
        summary: content?.slice(0, 300) || url,
        tags: [],
      };
    }

    // Prepare tags (ensure lowercase)
    const tags = ['link', ...(analysis.tags || []).map((tag) => tag.toLowerCase())];

    // Prepare metadata
    const metadata = {
      type: analysis.type,
      host: new URL(url).hostname,
      analysis: analysis,
    };

    // Save as SavedItem
    const item = await this.savedItemRepo.create({
      userId,
      title: analysis.summary.slice(0, 100),
      content: content || analysis.summary,
      url,
      tags,
      metadata,
      location: analysis.location || undefined,
    });

    logger.info('Link analyzed and saved', { userId, itemId: item.id, type: analysis.type, tags });

    return {
      item: SavedItemSchema.parse(item),
      analysis,
    };
  }
}

