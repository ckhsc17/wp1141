import type LineContext from 'bottender/dist/line/LineContext';

import type { LinkAnalysis, Reminder, SavedItem, Todo } from '@/domain/schemas';

// 如果需要 LIFF admin 入口，改用 Flex/URI 按鈕，避免 QuickReply 型別限制
const ADMIN_LIFF_URL = process.env.LIFF_ADMIN_URL ?? 'https://liff.line.me/YOUR_LIFF_ID';

/**
 * Truncate text to fit LINE Flex Message limits
 * LINE Flex Message Bubble JSON size limit is 10KB
 * For safety, we limit individual text components to 2000 characters
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 2000)
 * @returns Truncated text with ellipsis if needed
 */
function truncateText(text: string, maxLength: number = 2000): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

const quickReplyItems = [
  { label: '新增靈感', text: '新增靈感' },
  { label: '設定提醒', text: '設定提醒' },
  { label: '查看洞察', text: '查看洞察' },
  { label: '開啟小幽面板', text: '開啟小幽面板' },
] as const;

function buildQuickReplies() {
  return {
    items: quickReplyItems.map((item) => ({
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: item.label,
        text: item.text,
      },
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
              text: truncateText(summary, 2000),
              wrap: true,
              margin: 'md',
            },
            ...(saved.tags.length > 0
              ? [
                  {
                    type: 'text' as const,
                    text: truncateText(`標籤：${saved.tags.join(', ')}`, 500),
                    size: 'sm' as const,
                    color: '#aaaaaa',
                    margin: 'sm' as const,
                  },
                ]
              : []),
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
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: '開啟小幽面板',
                uri: ADMIN_LIFF_URL,
              },
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

export async function sendInsightMessage(context: LineContext, item: SavedItem): Promise<void> {
  await context.reply([
    {
      type: 'flex',
      altText: '已儲存靈感',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '已儲存靈感 ✨', weight: 'bold', size: 'md' },
            { type: 'text', text: truncateText(item.title || item.content, 2000), wrap: true, margin: 'md' },
            ...(item.tags.length > 0
              ? [
                  {
                    type: 'text' as const,
                    text: truncateText(`標籤：${item.tags.join(', ')}`, 500),
                    size: 'sm' as const,
                    color: '#aaaaaa',
                    margin: 'sm' as const,
                  },
                ]
              : []),
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

export async function sendTodoMessage(
  context: LineContext,
  todo: Todo,
  action: 'created' | 'listed' | 'updated',
): Promise<void> {
  if (action === 'listed') {
    // For list, we'll send a simple text message
    await context.reply([
      {
        type: 'text',
        text: `待辦事項：${todo.title}${todo.description ? `\n${todo.description}` : ''}\n狀態：${todo.status === 'pending' ? '待處理' : todo.status === 'done' ? '已完成' : '已取消'}`,
        quickReply: buildQuickReplies(),
      },
    ]);
    return;
  }

  await context.reply([
    {
      type: 'flex',
      altText: action === 'created' ? '已建立待辦事項' : '已更新待辦事項',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: action === 'created' ? '已建立待辦事項 ✅' : '已更新待辦事項',
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'text',
              text: truncateText(todo.title, 2000),
              wrap: true,
              margin: 'md',
              weight: 'bold',
            },
            ...(todo.description
              ? [
                  {
                    type: 'text' as const,
                    text: truncateText(todo.description, 2000),
                    wrap: true,
                    size: 'sm' as const,
                    color: '#666666',
                    margin: 'sm' as const,
                  },
                ]
              : []),
            {
              type: 'text' as const,
              text: `狀態：${todo.status === 'pending' ? '待處理' : todo.status === 'done' ? '已完成' : '已取消'}`,
              size: 'sm' as const,
              color: '#aaaaaa',
              margin: 'md' as const,
            },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendLinkMessage(
  context: LineContext,
  url: string,
  analysis: LinkAnalysis,
): Promise<void> {
  await context.reply([
    {
      type: 'flex',
      altText: '連結分析結果',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '已分析連結 📎',
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'text',
              text: `類型：${analysis.type}`,
              size: 'sm',
              color: '#666666',
              margin: 'md',
            },
            {
              type: 'text',
              text: truncateText(analysis.summary, 2000),
              wrap: true,
              margin: 'md',
            },
            ...(analysis.location
              ? [
                  {
                    type: 'text' as const,
                    text: `📍 地點：${analysis.location}`,
                    size: 'sm' as const,
                    color: '#666666',
                    margin: 'sm' as const,
                  },
                ]
              : []),
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: '查看連結',
                uri: url,
              },
            },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendJournalMessage(
  context: LineContext,
  content: string,
  action: 'saved',
): Promise<void> {
  await context.reply([
    {
      type: 'text',
      text: `已為你記錄：${content}`,
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendFeedbackMessage(context: LineContext, feedback: string): Promise<void> {
  await context.reply([
    {
      type: 'flex',
      altText: '生活回饋',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '小幽的生活回饋 💫',
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'text',
              text: truncateText(feedback, 2000),
              wrap: true,
              margin: 'md',
            },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendRecommendationMessage(
  context: LineContext,
  recommendation: string,
): Promise<void> {
  await context.reply([
    {
      type: 'flex',
      altText: '推薦內容',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '小幽的推薦 ✨',
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'text',
              text: truncateText(recommendation, 2000),
              wrap: true,
              margin: 'md',
            },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendChatMessage(context: LineContext, response: string): Promise<void> {
  await context.reply([
    {
      type: 'text',
      text: response,
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendTodosListMessage(context: LineContext, todos: Todo[]): Promise<void> {
  if (todos.length === 0) {
    await sendChatMessage(context, '目前沒有待辦事項呢！');
    return;
  }

  if (todos.length === 1) {
    await sendTodoMessage(context, todos[0], 'listed');
    return;
  }

  // For multiple todos, send a carousel or formatted list
  const todoList = todos
    .map((todo, idx) => {
      const statusText =
        todo.status === 'pending' ? '待處理' : todo.status === 'done' ? '已完成' : '已取消';
      return `${idx + 1}. ${todo.title} (${statusText})`;
    })
    .join('\n');

  await context.reply([
    {
      type: 'flex',
      altText: '待辦事項列表',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `找到 ${todos.length} 個待辦事項`,
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'text',
              text: truncateText(todoList, 2000),
              wrap: true,
              margin: 'md',
              size: 'sm',
            },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
  ]);
}

export async function sendTodoNotificationMessage(
  userId: string,
  todo: Todo,
): Promise<void> {
  // This function is used by the cron job to send push notifications
  // It uses lineClient directly instead of context
  const { lineClient } = await import('@/bot/lineBot');
  
  const dateStr = todo.date ? new Date(todo.date).toLocaleString('zh-TW', { 
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }) : '';

  await lineClient.pushMessages(userId, [
    {
      type: 'text',
      text: `⏰ 提醒：${todo.title}${dateStr ? `\n時間：${dateStr}` : ''}${todo.description ? `\n${todo.description}` : ''}`,
    },
  ]);
}

