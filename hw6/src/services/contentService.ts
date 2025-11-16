import { SharedContentSchema } from '@/domain/schemas';
import type { SavedItemRepository } from '@/repositories';
import { GeminiService } from './geminiService';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';

type ClassificationResult = {
  category: 'inspiration' | 'knowledge' | 'project' | 'tool' | 'entertainment';
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestedActions: string[];
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

    const item = await this.savedItemRepo.create({
      userId,
      sourceType: parsed.data.url ? 'link' : 'note',
      title: classification.summary.slice(0, 40),
      content: parsed.data.text ?? '',
      url: parsed.data.url,
      category: classification.category,
      tags: classification.suggestedActions.slice(0, 3),
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
      const parsed = JSON.parse(response) as ClassificationResult;
      logger.debug('Content classified by Gemini', {
        inputPreview: text.slice(0, 200),
        classification: parsed,
      });
      return parsed;
    } catch {
      logger.warn('Failed to parse Gemini classification response, using fallback', {
        inputPreview: text.slice(0, 200),
        rawResponsePreview: response.slice(0, 200),
      });
      return {
        category: 'inspiration',
        summary: text.slice(0, 40),
        sentiment: 'neutral',
        suggestedActions: [],
      };
    }
  }
}


