import type LineContext from 'bottender/dist/line/LineContext';

import {
  sendChatMessage,
  sendFeedbackMessage,
  sendInsightMessage,
  sendJournalMessage,
  sendLinkMessage,
  sendRecommendationMessage,
  sendReminderMessage,
  sendSavedItemMessage,
  sendTodoMessage,
  sendTodosListMessage,
  sendWelcomeMessage,
} from '@/bot/messages';
import { lineClient } from '@/bot/lineBot';
import { ensureUser } from '@/bot/userHelper';
import { repositories, services } from '@/container';
import { logger } from '@/utils/logger';

export async function handleLineEvent(context: LineContext): Promise<void> {
  const userId = context.event.source?.userId;
  const text = context.event.isText ? context.event.text?.trim() ?? '' : '';

  if (context.event.isFollow || context.event.isJoin) {
    // Ensure user exists when they follow/join
    if (userId) {
      await ensureUser(userId, lineClient, repositories.userRepo);
    }
    await sendWelcomeMessage(context);
    return;
  }

  if (!userId || !context.event.isText) {
    await sendWelcomeMessage(context);
    return;
  }

  // Ensure user exists before processing any message
  await ensureUser(userId, lineClient, repositories.userRepo);

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

    // Route to appropriate service based on intent
    switch (classification.intent) {
      case 'todo': {
        if (classification.subIntent === 'query') {
          // Query todos by natural language
          const todos = await services.todo.queryTodosByNaturalLanguage(userId, text);
          if (todos.length === 0) {
            await sendChatMessage(context, '找不到符合條件的待辦事項呢！');
          } else {
            await sendTodosListMessage(context, todos);
          }
        } else if (classification.subIntent === 'update') {
          // Update todo by natural language
          const updated = await services.todo.updateTodoByNaturalLanguage(userId, text);
          if (updated) {
            await sendTodoMessage(context, updated, 'updated');
          } else {
            await sendChatMessage(context, '找不到要更新的待辦事項呢，請確認待辦事項的名稱。');
          }
        } else {
          // Create todos (support multiple)
          const todos = await services.todo.createTodos(userId, text);
          if (todos.length === 1) {
            await sendTodoMessage(context, todos[0], 'created');
          } else {
            await sendChatMessage(context, `已為你建立 ${todos.length} 個待辦事項：\n${todos.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`);
          }
        }
        break;
      }

      case 'link': {
        // Extract URL from text or extractedData
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        const url = urlMatch?.[0] || (classification.extractedData?.url as string | undefined);

        if (!url) {
          await sendChatMessage(context, '我找不到連結呢，請確認訊息中包含有效的 URL。');
          return;
        }

        const result = await services.link.analyzeAndSave(userId, url, text);
        await sendLinkMessage(context, url, result.analysis);
        break;
      }

      case 'journal': {
        const entry = await services.journal.saveEntry(userId, text);
        await sendJournalMessage(context, entry.content, 'saved');
        break;
      }

      case 'feedback': {
        const feedback = await services.feedback.generateFeedback(userId);
        await sendFeedbackMessage(context, feedback);
        break;
      }

      case 'recommendation': {
        const recommendation = await services.recommendation.generateRecommendation(userId, text);
        await sendRecommendationMessage(context, recommendation);
        break;
      }

      case 'chat_history': {
        // Extract query from text or use full text
        const query = (classification.extractedData?.query as string | undefined) || text;
        const response = await services.chat.searchHistory(userId, query);
        await sendChatMessage(context, response);
        break;
      }

      case 'other':
      default: {
        // General chat
        const response = await services.chat.chat(userId, text);
        await sendChatMessage(context, response);
        break;
      }
    }
  } catch (error) {
    logger.error('Handle event failed', { error, userId, textPreview: text.slice(0, 100) });
    await context.reply([
      {
        type: 'text',
        text: '小幽現在有點忙碌，請稍後再試一次 🙏',
      },
    ]);
  }
}
