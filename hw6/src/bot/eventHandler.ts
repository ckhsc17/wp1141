// LINE webhook event type (from LINE Messaging API)
type LineWebhookEvent = {
  type: string;
  source?: {
    userId?: string;
    type: string;
    [key: string]: any;
  };
  message?: {
    type: string;
    text?: string;
    [key: string]: any;
  };
  replyToken?: string;
  webhookEventId?: string;
  timestamp?: number;
  [key: string]: any;
};

import {
  sendChatMessage,
  sendFeedbackMessage,
  sendInsightMessage,
  sendLinkMessage,
  sendRecommendationMessage,
  sendSavedItemMessage,
  sendTodoMessage,
  sendTodosListMessage,
  sendUsageGuideMessage,
  sendWelcomeMessage,
} from '@/bot/messages';
import { lineClient } from '@/bot/lineBot';
import { showTyping } from '@/bot/typingHelper';
import { ensureUser } from '@/bot/userHelper';
import { repositories, services } from '@/container';
import { logger } from '@/utils/logger';
import { isQuestion, classifyQuestionIntent } from '@/utils/questionDetector';

export async function handleLineEvent(event: LineWebhookEvent): Promise<void> {
  const userId = event.source?.userId;
  const replyToken = (event as any).replyToken; // replyToken is in the event object

  // Handle Follow/Join events
  if (event.type === 'follow' || event.type === 'join') {
    if (userId) {
      await ensureUser(userId, lineClient, repositories.userRepo);
      await sendWelcomeMessage(userId, replyToken);
    }
    return;
  }

  // Only process text messages
  if (event.type !== 'message' || event.message?.type !== 'text' || !userId) {
    if (userId) {
      await sendWelcomeMessage(userId, replyToken);
    }
    return;
  }

  const text = event.message?.text?.trim() ?? '';

  // Ensure user exists before processing any message
  await ensureUser(userId, lineClient, repositories.userRepo);

  // Handle usage guide quick reply
  if (text === '使用教學') {
    await sendUsageGuideMessage(userId, replyToken);
    return;
  }

  // Show typing indicator immediately when processing starts
  await showTyping(userId);

  try {
    // Classify intent using LLM
    const classification = await services.intentClassification.classify(userId, text);

    logger.debug('Intent classified', {
      userId,
      textPreview: text.slice(0, 100),
      intent: classification.intent,
      subIntent: classification.subIntent,
      confidence: classification.confidence,
    });

    // Check if a storage intent was incorrectly classified for a question
    // Storage intents: insight, knowledge, memory, music, life
    const storageIntents = ['insight', 'knowledge', 'memory', 'music', 'life'] as const;
    if (storageIntents.includes(classification.intent as any) && isQuestion(text)) {
      // Reclassify question to appropriate query intent
      const questionIntent = classifyQuestionIntent(text);
      if (questionIntent) {
        const originalIntent = classification.intent;
        classification.intent = questionIntent;
        classification.confidence = 0.6; // Lower confidence since it's a reclassification
        
        logger.warn('Reclassified question as query intent', {
          userId,
          originalIntent,
          newIntent: questionIntent,
          textPreview: text.slice(0, 100),
        });
      }
    }

    // Route to appropriate service based on intent
    switch (classification.intent) {
      case 'todo': {
        if (classification.subIntent === 'query') {
          // Query todos by natural language
          const todos = await services.todo.queryTodosByNaturalLanguage(userId, text);
          if (todos.length === 0) {
            await sendChatMessage(userId, '找不到符合條件的待辦事項呢！', replyToken);
          } else {
            await sendTodosListMessage(userId, todos, replyToken);
          }
        } else if (classification.subIntent === 'update') {
          // Update todo by natural language
          const updated = await services.todo.updateTodoByNaturalLanguage(userId, text);
          if (updated) {
            await sendTodoMessage(userId, updated, 'updated', replyToken);
          } else {
            await sendChatMessage(userId, '找不到要更新的待辦事項呢，請確認待辦事項的名稱。', replyToken);
          }
        } else {
          // Create todos (support multiple)
          const todos = await services.todo.createTodos(userId, text);
          if (todos.length === 1) {
            await sendTodoMessage(userId, todos[0], 'created', replyToken);
          } else {
            await sendChatMessage(userId, `已為你建立 ${todos.length} 個待辦事項：\n${todos.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`, replyToken);
          }
        }
        break;
      }

      case 'link': {
        // Extract URL from text or extractedData
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        const url = urlMatch?.[0] || (classification.extractedData?.url as string | undefined);

        if (!url) {
          await sendChatMessage(userId, '我找不到連結呢，請確認訊息中包含有效的 URL。', replyToken);
          return;
        }

        const result = await services.link.analyzeAndSave(userId, url, text);
        await sendLinkMessage(userId, url, result.analysis, replyToken);
        break;
      }

      case 'insight': {
        const item = await services.insight.saveInsight(userId, text);
        await sendInsightMessage(userId, item, replyToken);
        break;
      }

      case 'knowledge': {
        const item = await services.knowledge.saveKnowledge(userId, text);
        await sendSavedItemMessage(userId, item, '已儲存知識', replyToken);
        break;
      }

      case 'memory': {
        const item = await services.memory.saveMemory(userId, text);
        await sendSavedItemMessage(userId, item, '已儲存記憶', replyToken);
        break;
      }

      case 'music': {
        const item = await services.music.saveMusic(userId, text);
        await sendSavedItemMessage(userId, item, '已儲存音樂', replyToken);
        break;
      }

      case 'life': {
        const item = await services.life.saveLife(userId, text);
        await sendSavedItemMessage(userId, item, '已儲存活動', replyToken);
        break;
      }

      case 'feedback': {
        const feedback = await services.feedback.generateFeedback(userId, text);
        await sendFeedbackMessage(userId, feedback, replyToken);
        break;
      }

      case 'recommendation': {
        const recommendation = await services.recommendation.generateRecommendation(userId, text);
        await sendRecommendationMessage(userId, recommendation, replyToken);
        break;
      }

      case 'chat_history': {
        // Extract query from text or use full text
        const query = (classification.extractedData?.query as string | undefined) || text;
        const response = await services.chat.searchHistory(userId, query);
        await sendChatMessage(userId, response, replyToken);
        break;
      }

      case 'other':
      default: {
        // General chat
        const response = await services.chat.chat(userId, text);
        await sendChatMessage(userId, response, replyToken);
        break;
      }
    }
  } catch (error) {
    logger.error('Handle event failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      textPreview: text.slice(0, 100),
    });
    await sendChatMessage(userId, '小幽現在有點忙碌，請稍後再試一次 🙏', replyToken);
  }
}
