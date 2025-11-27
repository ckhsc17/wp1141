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
  sendCoinCountMessage,
  sendFeedbackMessage,
  sendInsightMessage,
  sendLinkMessage,
  sendRecommendationMessage,
  sendSavedItemMessage,
  sendTodoMessage,
  sendTodosAndMemoriesMessage,
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
import { checkDailyMessageLimit, isTooManyRequestsError, recordApiCall } from '@/utils/messageLimit';

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

  // Handle usage guide quick reply (内建功能，不計入限制)
  if (text === '使用教學') {
    await sendUsageGuideMessage(userId, replyToken);
    return;
  }

  // Handle coin count quick reply (内建功能，不計入限制)
  if (text === '查看幽靈幣數量') {
    const messageLimitCheck = await checkDailyMessageLimit(userId, repositories.savedItemRepo, 8);
    await sendCoinCountMessage(userId, messageLimitCheck.count, 8, replyToken);
    return;
  }

  // Show typing indicator immediately when processing starts
  await showTyping(userId);

  try {
    // Classify intent using LLM (intent classification 不算在用戶限制內)
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

    // Check if todo create was incorrectly classified for a query question
    // If text contains query keywords (even without question mark), it should be todo query
    if (classification.intent === 'todo' && classification.subIntent === 'create') {
      const lowerText = text.toLowerCase();
      const queryKeywords = ['幹嘛', '要做什麼', '要幹嘛', '做了什麼', '做了哪些', '哪些', '什麼', '查', '看'];
      // Check if it's a question OR contains query keywords
      if (isQuestion(text) || queryKeywords.some((keyword) => lowerText.includes(keyword))) {
        const originalSubIntent = classification.subIntent;
        classification.subIntent = 'query';
        classification.confidence = 0.6; // Lower confidence since it's a reclassification
        
        logger.warn('Reclassified todo create as query', {
          userId,
          originalSubIntent,
          newSubIntent: 'query',
          textPreview: text.slice(0, 100),
        });
      }
    }

    // Check daily API call limit before processing
    // Note: Intent classification already happened above and doesn't count toward limit
    // All other intents will trigger Gemini API calls
    const messageLimitCheck = await checkDailyMessageLimit(userId, repositories.savedItemRepo, 8);
    if (messageLimitCheck.exceeded) {
      await sendChatMessage(userId, '今天的幽靈幣用完啦！明天再來找我聊天吧～ 👻', replyToken);
      return;
    }
    
    // Record API call before processing (intent classification doesn't count)
    await recordApiCall(userId, repositories.savedItemRepo, classification.intent);

    // Route to appropriate service based on intent
    switch (classification.intent) {
      case 'todo': {
        if (classification.subIntent === 'query') {
          // Query todos by natural language
          const todos = await services.todo.queryTodosByNaturalLanguage(userId, text);
          
          // Check if query contains "做了什麼" or similar keywords - if so, also search memories
          const lowerText = text.toLowerCase();
          const activityKeywords = ['做了什麼', '做了哪些', '做了', '做了什麼事', '做了哪些事'];
          const shouldIncludeMemories = activityKeywords.some((keyword) => lowerText.includes(keyword));
          
          if (shouldIncludeMemories) {
            // Also search for memories with the same date filter
            const parsedQuery = await services.todo.parseTodoQuery(userId, text);
            const memories = await repositories.savedItemRepo.searchByTags(userId, ['memory'], 10);
            
            // Filter memories by date if specificDate or timeRange was parsed
            let filteredMemories = memories;
            if (parsedQuery.specificDate) {
              try {
                const [year, month, day] = parsedQuery.specificDate.split('-').map(Number);
                const targetDate = new Date(year, month - 1, day);
                const nextDay = new Date(year, month - 1, day + 1);
                filteredMemories = memories.filter((memory) => {
                  const memoryDate = new Date(memory.createdAt);
                  return memoryDate >= targetDate && memoryDate < nextDay;
                });
              } catch (error) {
                logger.warn('Failed to filter memories by date', { error });
              }
            } else if (parsedQuery.timeRange) {
              // Apply similar time range filtering for memories
              const now = new Date();
              let startDate: Date | null = null;
              let endDate: Date | null = null;
              
              switch (parsedQuery.timeRange) {
                case '昨天': {
                  startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                  endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  break;
                }
                case '今天': {
                  startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                  break;
                }
                case '上禮拜':
                case '上週': {
                  const dayOfWeek = now.getDay();
                  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 7);
                  endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
                  break;
                }
                // Add more time ranges as needed
              }
              
              if (startDate) {
                if (endDate) {
                  filteredMemories = memories.filter((memory) => {
                    const memoryDate = new Date(memory.createdAt);
                    return memoryDate >= startDate! && memoryDate < endDate!;
                  });
                } else {
                  filteredMemories = memories.filter((memory) => {
                    const memoryDate = new Date(memory.createdAt);
                    return memoryDate >= startDate!;
                  });
                }
              }
            }
            
            // Send combined results
            if (todos.length === 0 && filteredMemories.length === 0) {
              await sendChatMessage(userId, '找不到符合條件的待辦事項或記憶呢！', replyToken);
            } else {
              await sendTodosAndMemoriesMessage(userId, todos, filteredMemories, replyToken);
            }
          } else {
            // Only todos
            if (todos.length === 0) {
              await sendChatMessage(userId, '找不到符合條件的待辦事項呢！', replyToken);
            } else {
              await sendTodosListMessage(userId, todos, replyToken);
            }
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
            await sendTodosListMessage(
              userId,
              todos,
              replyToken,
              {
                title: `已為你建立 ${todos.length} 個待辦事項`,
                //showStatus: false, // 刚创建的待办事项都是 pending，不需要显示状态
              },
            );
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
        // General chat - save as SavedItem first, then respond
        const savedItem = await services.chat.saveChat(userId, text);
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

    // Check if it's a 429 Too Many Requests error
    if (isTooManyRequestsError(error)) {
      await sendChatMessage(
        userId,
        '小幽今天處理太多請求了，有點累...讓我休息一下，晚點再來找我聊天吧～ 😴',
        replyToken,
      );
    } else {
      await sendChatMessage(userId, '小幽現在有點忙碌，請稍後再試一次 🙏', replyToken);
    }
  }
}
