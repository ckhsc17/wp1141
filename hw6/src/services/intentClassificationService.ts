import { GeminiService } from './geminiService';
import { IntentClassificationSchema, type IntentClassification } from '@/domain/schemas';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class IntentClassificationService {
  constructor(private readonly gemini: GeminiService) {}

  async classify(userId: string, text: string): Promise<IntentClassification> {
    // 使用簡化的 prompt（5 種意圖）
    const response = await this.gemini.generate({
      template: 'classifyIntentSimplified',
      payload: { text },
    });

    try {
      // Try to extract JSON from response (might be wrapped in markdown code blocks)
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as any;
      // Convert null to undefined for optional fields
      const cleaned = nullToUndefined(parsed);
      const validated = IntentClassificationSchema.parse(cleaned);

      // Note: Debug log is handled in eventHandler.ts to avoid duplication

      return validated;
    } catch (error) {
      logger.warn('Failed to parse intent classification, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        rawResponsePreview: response.slice(0, 200),
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback: 最小 Fallback（只保留最明顯的特徵）
      const lowerText = text.toLowerCase();
      
      // 只保留 link 檢測（最明顯的特徵）
      if (lowerText.includes('http') || lowerText.startsWith('https://')) {
        return {
          intent: 'link',
          confidence: 0.8,
        };
      }

      // 其他情況 fallback 到 'other'
      return {
        intent: 'other',
        confidence: 0.5,
      };
    }
  }
}

