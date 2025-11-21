import type LineContext from 'bottender/dist/line/LineContext';

import type { LinkAnalysis, Reminder, SavedItem, Todo } from '@/domain/schemas';

// LIFF URLs for dashboard and settings
const LIFF_DASHBOARD_URL = process.env.LIFF_DASHBOARD_URL ?? 'https://liff.line.me/YOUR_DASHBOARD_LIFF_ID';
const LIFF_SETTINGS_URL = process.env.LIFF_SETTINGS_URL ?? 'https://liff.line.me/YOUR_SETTINGS_LIFF_ID';

/**
 * Truncate text to fit LINE Flex Message limits
 * 
 * LINE Flex Message limits:
 * - Single Bubble JSON size: 10KB
 * - Carousel JSON size: 50KB
 * - Text component: No explicit character limit, but must fit within JSON size limit
 * 
 * We use 4000 characters as default to leave buffer for JSON structure overhead.
 * For shorter content like tags, use a smaller limit (e.g., 500).
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 4000)
 * @returns Truncated text with ellipsis if needed
 */
function truncateText(text: string, maxLength: number = 4000): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

const quickReplyItems = [
  {
    label: '📚 使用教學',
    text: '使用教學',
  },
  {
    label: '📖 小幽的身世',
    uri: 'https://bowenchen.vercel.app/files/novel.pdf',
  },

  {
    label: '👤 我的',
    uri: LIFF_DASHBOARD_URL,
  },
  {
    label: '⚙️ 設定',
    uri: LIFF_SETTINGS_URL,
  },
] as const;

function buildQuickReplies() {
  return {
    items: quickReplyItems.map((item) => {
      if ('text' in item) {
        // Message action for usage guide
        return {
          type: 'action' as const,
          action: {
            type: 'message' as const,
            label: item.label,
            text: item.text,
          },
        };
      } else {
        // URI action
        return {
          type: 'action' as const,
          action: {
            type: 'uri' as const,
            label: item.label,
            uri: item.uri,
          },
        };
      }
    }),
  } as any; // Bottender 的型別定義可能不支援所有 action 類型，使用 as any 繞過型別檢查
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
              text: summary || '已收藏你的內容 ✨',
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'text',
              text: truncateText(saved.title || saved.content),
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
        // footer: {
        //   type: 'box',
        //   layout: 'vertical',
        //   spacing: 'sm',
        //   contents: [
        //     saved.url
        //       ? {
        //           type: 'button',
        //           style: 'link',
        //           height: 'sm',
        //           action: {
        //             type: 'uri',
        //             label: '查看連結',
        //             uri: saved.url,
        //           },
        //         }
        //       : {
        //           type: 'text',
        //           text: '隨時輸入「查看洞察」讓我幫你整理。',
        //           wrap: true,
        //           size: 'sm',
        //           color: '#aaaaaa',
        //         },
        //     {
        //       type: 'button',
        //       style: 'link',
        //       height: 'sm',
        //       action: {
        //         type: 'uri',
        //         label: '開啟小幽面板',
        //         uri: LIFF_DASHBOARD_URL,
        //       },
        //     },
        //   ],
        // },
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
            { type: 'separator', margin: 'md' },
            { type: 'text', text: truncateText(item.title || item.content), wrap: true, margin: 'md' },
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

export async function sendUsageGuideMessage(context: LineContext): Promise<void> {
  await context.reply([
    {
      type: 'flex',
      altText: 'Booboo 小幽使用教學',
      contents: {
        type: 'carousel',
        contents: [
          // Page 1: Introduction and Todo
          {
            type: 'bubble',
            hero: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '📚 使用教學',
                  weight: 'bold',
                  size: 'xl',
                  color: '#FFFFFF',
                  align: 'center',
                },
              ],
              backgroundColor: '#FF6B6B',
              paddingAll: '20px',
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'Booboo 小幽',
                  weight: 'bold',
                  size: 'lg',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '個人生活記錄與 AI 助手 - 直接和小幽用自然語言對話！',
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm',
                },
                {
                  type: 'separator',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '1️⃣ 待辦事項',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '新增：我要吃飯、取貨、寫作業',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '更新：我寫完作業了！',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '查詢：明天要幹嘛？',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
              ],
            },
          },
          // Page 2: Content Saving
          {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '2️⃣ 記錄內容',
                  weight: 'bold',
                  size: 'lg',
                  margin: 'md',
                },
                {
                  type: 'separator',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '🔗 資訊連結',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '分享連結自動分析儲存',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '💡 靈感',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '記錄頓悟和啟發',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '📖 知識',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '記錄技術、學術、常識',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '💭 記憶',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '記錄個人經驗、日記',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
              ],
            },
          },
          // Page 3: Music, Life, and Query Features
          {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '3️⃣ 更多功能',
                  weight: 'bold',
                  size: 'lg',
                  margin: 'md',
                },
                {
                  type: 'separator',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '🎵 音樂',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '記錄想練習的歌曲',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '🎬 生活活動',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '記錄展覽、電影、活動',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '💬 回饋請求',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '給我一些生活建議',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '✨ 推薦請求',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '推薦一些技術文章',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '🔍 對話紀錄查詢',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '我有沒有聊過 XXX？',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
              ],
            },
          },
        ],
      },
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
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'text',
              text: truncateText(todo.title),
              wrap: true,
              margin: 'md',
              weight: 'bold',
            },
            ...(todo.description
              ? [
                  {
                    type: 'text' as const,
                    text: truncateText(todo.description),
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
              type: 'separator',
              margin: 'md',
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
              text: truncateText(analysis.summary),
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
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'text',
              text: truncateText(feedback),
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
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'text',
              text: truncateText(recommendation),
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
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'text',
              text: truncateText(todoList),
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
  // messaging-api-line will automatically call POST /v2/bot/message/push
  const { lineClient } = await import('@/bot/lineBot');
  const { logger } = await import('@/utils/logger');
  
  const dateStr = todo.date ? new Date(todo.date).toLocaleString('zh-TW', { 
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }) : '';

  const notificationText = `⏰ 提醒：${todo.title}${dateStr ? `\n時間：${dateStr}` : ''}${todo.description ? `\n${todo.description}` : ''}`;

  try {
    await lineClient.pushMessages(userId, [
      {
        type: 'text',
        text: notificationText,
      },
    ]);

    logger.info('Todo notification message sent', {
      userId,
      todoId: todo.id,
      title: todo.title,
      notificationText: notificationText.slice(0, 100), // Log first 100 chars
    });
  } catch (error) {
    logger.error('Failed to send todo notification message', {
      userId,
      todoId: todo.id,
      title: todo.title,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error; // Re-throw to allow caller to handle
  }
}

