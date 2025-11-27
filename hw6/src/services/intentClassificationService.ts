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

      // Note: Debug log is handled in eventHandler.ts to avoid duplication

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
      
      // Priority 1: Check for links
      if (lowerText.includes('http') || lowerText.includes('www.') || lowerText.startsWith('https://')) {
        return {
          intent: 'link',
          confidence: 0.7,
        };
      }
      
      // Priority 2: Check for todos
      if (
        lowerText.includes('待辦') ||
        lowerText.includes('todo') ||
        lowerText.includes('要做') ||
        lowerText.includes('我明天要') ||
        lowerText.includes('提醒我') ||
        lowerText.includes('提醒') ||
        (lowerText.includes('明天') && (lowerText.includes('要') || lowerText.includes('得')))
      ) {
        // Check for query keywords: 查、看、做了、哪些、幹嘛、什麼、要幹嘛、要做什麼
        if (
          lowerText.includes('查') ||
          lowerText.includes('看') ||
          lowerText.includes('做了') ||
          lowerText.includes('哪些') ||
          lowerText.includes('幹嘛') ||
          lowerText.includes('要做什麼') ||
          lowerText.includes('要幹嘛') ||
          (lowerText.includes('什麼') && (lowerText.includes('要做') || lowerText.includes('要幹')))
        ) {
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
      
      // Priority 3: Check for query intents (feedback, recommendation, chat_history) BEFORE storage intents
      // Check feedback: 回饋、建議、分析、評估、狀況、如何、怎樣、幫我、給我
      if (
        lowerText.includes('回饋') ||
        lowerText.includes('feedback') ||
        (lowerText.includes('建議') && !lowerText.includes('推薦')) ||
        lowerText.includes('分析') ||
        lowerText.includes('評估') ||
        (lowerText.includes('狀況') && (lowerText.includes('如何') || lowerText.includes('怎樣'))) ||
        (lowerText.includes('如何') && (lowerText.includes('生活') || lowerText.includes('時間') || lowerText.includes('狀態') || lowerText.includes('狀況'))) ||
        (lowerText.includes('怎樣') && (lowerText.includes('生活') || lowerText.includes('時間') || lowerText.includes('狀態'))) ||
        (lowerText.includes('幫我') && (lowerText.includes('分析') || lowerText.includes('建議'))) ||
        (lowerText.includes('給我') && (lowerText.includes('建議') || lowerText.includes('回饋') || lowerText.includes('分析')))
      ) {
        return {
          intent: 'feedback',
          confidence: 0.7,
        };
      }
      
      // Check recommendation: 推薦、可以、有什麼、給我推薦
      if (
        lowerText.includes('推薦') ||
        lowerText.includes('recommend') ||
        (lowerText.includes('可以') && (lowerText.includes('聽') || lowerText.includes('看') || lowerText.includes('讀'))) ||
        lowerText.includes('有什麼') ||
        (lowerText.includes('給我') && lowerText.includes('推薦'))
      ) {
        return {
          intent: 'recommendation',
          confidence: 0.7,
        };
      }
      
      // Check chat_history: 對話、聊過、說過、之前、過往、紀錄、記得、有沒有、查詢、搜尋
      if (
        lowerText.includes('對話') ||
        lowerText.includes('聊過') ||
        lowerText.includes('說過') ||
        (lowerText.includes('之前') && (lowerText.includes('聊') || lowerText.includes('說') || lowerText.includes('提到'))) ||
        lowerText.includes('過往') ||
        (lowerText.includes('紀錄') && (lowerText.includes('對話') || lowerText.includes('過往'))) ||
        (lowerText.includes('記得') && (lowerText.includes('之前') || lowerText.includes('聊'))) ||
        (lowerText.includes('有沒有') && (lowerText.includes('聊') || lowerText.includes('說'))) ||
        (lowerText.includes('查詢') && (lowerText.includes('對話') || lowerText.includes('紀錄'))) ||
        (lowerText.includes('搜尋') && (lowerText.includes('對話') || lowerText.includes('紀錄')))
      ) {
        return {
          intent: 'chat_history',
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

