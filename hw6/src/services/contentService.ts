import { SharedContentSchema } from '@/domain/schemas';
import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';

type ClassificationResult = {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
};

export class ContentService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async saveSharedContent(userId: string, rawContent: unknown) {
    const parsed = SharedContentSchema.safeParse(rawContent);
    if (!parsed.success) {
      throw new ValidationError('Invalid shared content', { issues: parsed.error.issues });
    }

    const text = parsed.data.text ?? parsed.data.url ?? '';
    const classification = await this.classify(text);

    // Ensure tags are lowercase
    const tags = (classification.tags || []).map((tag) => tag.toLowerCase());

    const item = await this.savedItemRepo.create({
      userId,
      title: classification.summary.slice(0, 40),
      content: parsed.data.text ?? '',
      url: parsed.data.url,
      tags,
    });

    logger.info('Saved shared content', { userId, itemId: item.id });

    return {
      item,
      classification,
    };
  }

  private async classify(text: string): Promise<ClassificationResult> {
    const response = await this.gemini.generate({
      template: 'classifyContent',
      payload: { text },
    });

    try {
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as ClassificationResult;
      const cleaned = nullToUndefined(parsed);
      logger.debug('Content classified by Gemini', {
        inputPreview: text.slice(0, 200),
        classification: cleaned,
      });
      return cleaned;
    } catch {
      logger.warn('Failed to parse Gemini classification response, using fallback', {
        inputPreview: text.slice(0, 200),
        rawResponsePreview: response.slice(0, 200),
      });
      return {
        summary: text.slice(0, 40),
        sentiment: 'neutral',
        tags: ['content'],
      };
    }
  }
}


