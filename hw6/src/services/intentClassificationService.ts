import { GeminiService } from './geminiService';
import { IntentClassificationSchema, type IntentClassification } from '@/domain/schemas';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class IntentClassificationService {
  constructor(private readonly gemini: GeminiService) {}

  async classify(userId: string, text: string): Promise<IntentClassification> {
    const response = await this.gemini.generate({
      template: 'classifyIntent',
      payload: { text },
    });

    try {
      // Try to extract JSON from response (might be wrapped in markdown code blocks)
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as any;
      // Convert null to undefined for optional fields
      const cleaned = nullToUndefined(parsed);
      const validated = IntentClassificationSchema.parse(cleaned);

      logger.debug('Intent classified', {
        userId,
        textPreview: text.slice(0, 100),
        intent: validated.intent,
        subIntent: validated.subIntent,
        confidence: validated.confidence,
      });

      return validated;
    } catch (error) {
      logger.warn('Failed to parse intent classification, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        rawResponsePreview: response.slice(0, 200),
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback: simple heuristics
      const lowerText = text.toLowerCase();
      if (lowerText.includes('http') || lowerText.includes('www.') || lowerText.startsWith('https://')) {
        return {
          intent: 'link',
          confidence: 0.7,
        };
      }
      if (lowerText.includes('待辦') || lowerText.includes('todo') || lowerText.includes('要做')) {
        if (lowerText.includes('查') || lowerText.includes('看') || lowerText.includes('做了') || lowerText.includes('哪些')) {
          return {
            intent: 'todo',
            subIntent: 'query',
            confidence: 0.7,
          };
        }
        if (lowerText.includes('完成') || lowerText.includes('寫完') || lowerText.includes('做完') || lowerText.includes('取消')) {
          return {
            intent: 'todo',
            subIntent: 'update',
            confidence: 0.7,
          };
        }
        return {
          intent: 'todo',
          subIntent: 'create',
          confidence: 0.7,
        };
      }
      if (lowerText.includes('回饋') || lowerText.includes('建議') || lowerText.includes('feedback')) {
        return {
          intent: 'feedback',
          confidence: 0.7,
        };
      }
      if (lowerText.includes('推薦') || lowerText.includes('recommend')) {
        return {
          intent: 'recommendation',
          confidence: 0.7,
        };
      }
      if (lowerText.includes('對話') || lowerText.includes('聊過') || lowerText.includes('說過')) {
        return {
          intent: 'chat_history',
          confidence: 0.7,
        };
      }
      // Check for recommendation first (詢問推薦)
      if (
        lowerText.includes('推薦') ||
        lowerText.includes('可以') ||
        lowerText.includes('有什麼') ||
        lowerText.includes('建議') ||
        lowerText.includes('recommend')
      ) {
        return {
          intent: 'recommendation',
          confidence: 0.7,
        };
      }
      // Check for music storage (儲存音樂)
      if (
        (lowerText.includes('solo') || lowerText.includes('音樂') || lowerText.includes('歌') || lowerText.includes('music')) &&
        !lowerText.includes('可以') &&
        !lowerText.includes('推薦') &&
        !lowerText.includes('有什麼')
      ) {
        return {
          intent: 'music',
          confidence: 0.7,
        };
      }
      // Check for life activity storage (儲存活動)
      if (
        (lowerText.includes('展覽') || lowerText.includes('電影') || lowerText.includes('活動') || lowerText.includes('展')) &&
        !lowerText.includes('可以') &&
        !lowerText.includes('推薦') &&
        !lowerText.includes('有什麼')
      ) {
        return {
          intent: 'life',
          confidence: 0.7,
        };
      }
      if (lowerText.includes('靈感') || lowerText.includes('啟發') || lowerText.includes('頓悟')) {
        return {
          intent: 'insight',
          confidence: 0.7,
        };
      }
      if (lowerText.includes('知識') || lowerText.includes('技術') || lowerText.includes('學到') || lowerText.includes('知識')) {
        return {
          intent: 'knowledge',
          confidence: 0.7,
        };
      }
      if (lowerText.includes('記憶') || lowerText.includes('記得') || lowerText.includes('聊到') || lowerText.includes('發生')) {
        return {
          intent: 'memory',
          confidence: 0.7,
        };
      }

      return {
        intent: 'other',
        confidence: 0.5,
      };
    }
  }
}

