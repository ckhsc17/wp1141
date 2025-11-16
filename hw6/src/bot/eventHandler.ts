import type LineContext from 'bottender/dist/line/LineContext';

import {
  sendInsightMessage,
  sendReminderMessage,
  sendSavedItemMessage,
  sendWelcomeMessage,
} from '@/bot/messages';
import { services } from '@/container';
import { logger } from '@/utils/logger';

export async function handleLineEvent(context: LineContext): Promise<void> {
  const userId = context.event.source?.userId;
  const text = context.event.isText ? context.event.text?.trim() ?? '' : '';

  if (context.event.isFollow || context.event.isJoin) {
    await sendWelcomeMessage(context);
    return;
  }

  if (!userId || !context.event.isText) {
    await sendWelcomeMessage(context);
    return;
  }

  try {
    if (/提醒|remind/i.test(text)) {
      const reminder = await services.reminders.createReminder(userId, {
        title: text.replace(/提醒|remind/i, '').trim() || '生活提醒',
        triggerAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      await sendReminderMessage(context, reminder);
      return;
    }

    if (/洞察|insight|分析/i.test(text)) {
      const insight = await services.insight.generateDailyInsight(userId);
      await sendInsightMessage(context, insight);
      return;
    }

    const shared = await services.content.saveSharedContent(userId, {
      text,
      url: text.startsWith('http') ? text : undefined,
    });
    await sendSavedItemMessage(context, shared.item, shared.classification.summary);
  } catch (error) {
    logger.error('Handle event failed', { error, userId });
    await context.reply([
      {
        type: 'text',
        text: '小幽現在有點忙碌，請稍後再試一次 🙏',
      },
    ]);
  }
}

