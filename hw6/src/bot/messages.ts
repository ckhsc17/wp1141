import type LineContext from 'bottender/dist/line/LineContext';

import type { Insight, Reminder, SavedItem } from '@/domain/schemas';

const quickReplyItems = [
  { label: '新增靈感', text: '新增靈感' },
  { label: '設定提醒', text: '設定提醒' },
  { label: '查看洞察', text: '查看洞察' },
] as const;

function buildQuickReplies() {
  return {
    items: quickReplyItems.map((item) => ({
      type: 'action' as const,
      action: { type: 'message' as const, label: item.label, text: item.text },
    })),
  };
}

export async function sendSavedItemMessage(
  context: LineContext,
  saved: SavedItem,
  summary: string,
): Promise<void> {
  await context.reply([
    {
      type: 'flex',
      altText: '已為你收藏生活紀錄',
      contents: {
        type: 'bubble',
        hero: saved.url
          ? {
              type: 'image',
              url: 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png',
              size: 'full',
              aspectRatio: '20:13',
              aspectMode: 'cover',
            }
          : undefined,
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '已收藏你的靈感 ✨',
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'text',
              text: summary,
              wrap: true,
              margin: 'md',
            },
            {
              type: 'text',
              text: `分類：${saved.category}`,
              size: 'sm',
              color: '#aaaaaa',
              margin: 'sm',
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            saved.url
              ? {
                  type: 'button',
                  style: 'link',
                  height: 'sm',
                  action: {
                    type: 'uri',
                    label: '查看連結',
                    uri: saved.url,
                  },
                }
              : {
                  type: 'text',
                  text: '隨時輸入「查看洞察」讓我幫你整理。',
                  wrap: true,
                  size: 'sm',
                  color: '#aaaaaa',
                },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendReminderMessage(
  context: LineContext,
  reminder: Reminder,
): Promise<void> {
  await context.reply([
    {
      type: 'text',
      text: `我會在 ${reminder.triggerAt.toLocaleString()} 提醒你：「${reminder.title}」`,
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendInsightMessage(context: LineContext, insight: Insight): Promise<void> {
  await context.reply([
    {
      type: 'flex',
      altText: '今日洞察',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '小幽給你的提醒', weight: 'bold', size: 'md' },
            { type: 'text', text: insight.summary, wrap: true, margin: 'md' },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendWelcomeMessage(context: LineContext): Promise<void> {
  await context.reply([
    {
      type: 'text',
      text: '嗨，我是 Booboo 小幽 👋 想記錄靈感、設定提醒或聽聽建議，都可以跟我說！\n範例：\n- 「幫我記下今天看到的文章 https://...」\n- 「提醒我明天 9 點要寫日記」\n- 「幫我整理最近的想法」',
      quickReply: buildQuickReplies(),
    },
  ]);
}

