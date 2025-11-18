import { GeminiService } from './geminiService';
import { IntentClassificationSchema, type IntentClassification } from '@/domain/schemas';
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
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      if (jsonStr.includes('<JSON>')) {
        const match = jsonStr.match(/<JSON>([\s\S]*?)<\/JSON>/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonStr) as IntentClassification;
      const validated = IntentClassificationSchema.parse(parsed);

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

      return {
        intent: 'other',
        confidence: 0.5,
      };
    }
  }
}

