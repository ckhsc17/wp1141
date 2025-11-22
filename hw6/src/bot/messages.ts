import type { LinkAnalysis, Reminder, SavedItem, Todo } from '@/domain/schemas';
import { lineClient } from './lineBot';
import { logger } from '@/utils/logger';

// LIFF URLs for dashboard and settings
const LIFF_DASHBOARD_URL = process.env.LIFF_DASHBOARD_URL ?? 'https://liff.line.me/YOUR_DASHBOARD_LIFF_ID';
const LIFF_SETTINGS_URL = process.env.LIFF_SETTINGS_URL ?? 'https://liff.line.me/YOUR_SETTINGS_LIFF_ID';

/**
 * Calculate the size of a string when JSON stringified
 * @param str - String to measure
 * @returns Size in bytes
 */
function getJsonStringSize(str: string): number {
  // JSON.stringify adds quotes and escapes special characters
  // We need to measure the actual size including JSON encoding overhead
  return Buffer.byteLength(JSON.stringify(str), 'utf8');
}

/**
 * Truncate text to fit LINE Flex Message limits based on actual JSON size
 * 
 * LINE Flex Message limits:
 * - Single Bubble JSON size: 10KB
 * - Carousel JSON size: 50KB
 * - Text component: No explicit character limit, but must fit within JSON size limit
 * 
 * This function truncates based on actual JSON byte size rather than character count,
 * which is more accurate for Chinese/multibyte characters.
 * 
 * @param text - Text to truncate
 * @param maxBytes - Maximum size in bytes (default: 8000, leaving 2KB buffer for JSON structure)
 * @returns Truncated text with ellipsis if needed
 */
function truncateTextBySize(text: string, maxBytes: number = 8000): string {
  // Check if text fits within limit
  if (getJsonStringSize(text) <= maxBytes) {
    return text;
  }

  // Binary search for the maximum length that fits
  let left = 0;
  let right = text.length;
  let bestLength = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const truncated = text.slice(0, mid) + '...';
    const size = getJsonStringSize(truncated);

    if (size <= maxBytes) {
      bestLength = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (bestLength === 0) {
    return '...';
  }

  return text.slice(0, bestLength) + '...';
}

/**
 * Truncate text by character count (for backwards compatibility and simple cases)
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum character count (default: 6000, more generous for Chinese)
 * @returns Truncated text with ellipsis if needed
 */
function truncateText(text: string, maxLength: number = 6000): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Truncate text for Flex Message, using size-based truncation for accuracy
 * This is the recommended function to use for Flex Message text components
 * 
 * @param text - Text to truncate
 * @param maxBytes - Maximum size in bytes (default: 8000)
 * @returns Truncated text with ellipsis if needed
 */
function truncateFlexText(text: string, maxBytes: number = 8000): string {
  return truncateTextBySize(text, maxBytes);
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
  } as any; // LINE API 的型別定義可能不完整，使用 as any 繞過型別檢查
}

/**
 * Send messages to LINE user
 * Uses replyMessage if replyToken is provided, otherwise uses pushMessages
 */
async function sendMessages(
  userId: string,
  messages: any[],
  replyToken?: string,
): Promise<void> {
  try {
    if (replyToken) {
      // Use replyMessages for webhook events (has replyToken)
      await lineClient.replyMessages(replyToken, messages);
    } else {
      // Use pushMessages for notifications or when no replyToken
      await lineClient.pushMessages(userId, messages);
    }
  } catch (error) {
    logger.error('Failed to send messages', {
      userId,
      hasReplyToken: !!replyToken,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function sendSavedItemMessage(
  userId: string,
  saved: SavedItem,
  summary: string,
  replyToken?: string,
): Promise<void> {
  await sendMessages(
    userId,
    [
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
              text: truncateFlexText(saved.title || saved.content),
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
  userId: string,
  reminder: Reminder,
  replyToken?: string,
): Promise<void> {
  await sendMessages(
    userId,
    [
      {
        type: 'text',
        text: `我會在 ${reminder.triggerAt.toLocaleString()} 提醒你：「${reminder.title}」`,
        quickReply: buildQuickReplies(),
      },
    ],
    replyToken,
  );
}

export async function sendInsightMessage(
  userId: string,
  item: SavedItem,
  replyToken?: string,
): Promise<void> {
  await sendMessages(
    userId,
    [
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
            { type: 'text', text: truncateFlexText(item.title || ''), wrap: true, margin: 'md' },
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
    ],
    replyToken,
  );
}

export async function sendWelcomeMessage(userId: string, replyToken?: string): Promise<void> {
  await sendMessages(
    userId,
    [
    {
      type: 'text',
      text: '嗨，我是 Booboo 小幽 👋 想記錄靈感、設定提醒或聽聽建議，都可以跟我說！\n範例：\n- 「幫我記下今天看到的文章 https://...」\n- 「提醒我明天 9 點要寫日記」\n- 「幫我整理最近的想法」',
      quickReply: buildQuickReplies(),
    },
    ],
    replyToken,
  );
}

export async function sendUsageGuideMessage(userId: string, replyToken?: string): Promise<void> {
  await sendMessages(
    userId,
    [
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
    ],
    replyToken,
  );
}

export async function sendTodoMessage(
  userId: string,
  todo: Todo,
  action: 'created' | 'listed' | 'updated',
  replyToken?: string,
): Promise<void> {
  if (action === 'listed') {
    // For list, we'll send a simple text message
    await sendMessages(
      userId,
      [
        {
          type: 'text',
          text: `待辦事項：${todo.title}${todo.description ? `\n${todo.description}` : ''}\n狀態：${todo.status === 'pending' ? '待處理' : todo.status === 'done' ? '已完成' : '已取消'}`,
          quickReply: buildQuickReplies(),
        },
      ],
      replyToken,
    );
    return;
  }

  await sendMessages(
    userId,
    [
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
              text: truncateFlexText(todo.title),
              wrap: true,
              margin: 'md',
              weight: 'bold',
            },
            ...(todo.description
              ? [
                  {
                    type: 'text' as const,
                    text: truncateFlexText(todo.description || ''),
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
    ],
    replyToken,
  );
}

export async function sendLinkMessage(
  userId: string,
  url: string,
  analysis: LinkAnalysis,
  replyToken?: string,
): Promise<void> {
  await sendMessages(
    userId,
    [
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
              text: truncateFlexText(analysis.summary || ''),
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
    ],
    replyToken,
  );
}

export async function sendJournalMessage(
  userId: string,
  content: string,
  action: 'saved',
  replyToken?: string,
): Promise<void> {
  await sendMessages(
    userId,
    [
      {
        type: 'text',
        text: `已為你記錄：${content}`,
        quickReply: buildQuickReplies(),
      },
    ],
    replyToken,
  );
}

export async function sendFeedbackMessage(
  userId: string,
  feedback: string,
  replyToken?: string,
): Promise<void> {
  // Check if feedback is too long for a single Flex Message (10KB limit)
  // If too long, split into multiple text messages instead of truncating
  const feedbackMessage = {
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
            text: feedback,
            wrap: true,
            margin: 'md',
          },
        ],
      },
    },
    quickReply: buildQuickReplies(),
  };

  // Check JSON size
  const messageJson = JSON.stringify([feedbackMessage]);
  const messageSize = Buffer.byteLength(messageJson, 'utf8');

  if (messageSize > 10000) {
    // If too large, send as multiple text messages instead
    const chunkSize = 4000; // Split into chunks of ~4000 characters
    const chunks: string[] = [];
    for (let i = 0; i < feedback.length; i += chunkSize) {
      chunks.push(feedback.slice(i, i + chunkSize));
    }

    const messages = chunks.map((chunk, idx) => ({
      type: 'text' as const,
      text: idx === 0 ? `小幽的生活回饋 💫\n\n${chunk}` : chunk,
      quickReply: idx === chunks.length - 1 ? buildQuickReplies() : undefined,
    }));

    await sendMessages(userId, messages, replyToken);
  } else {
    await sendMessages(userId, [feedbackMessage], replyToken);
  }
}

export async function sendRecommendationMessage(
  userId: string,
  recommendation: string,
  replyToken?: string,
): Promise<void> {
  // Check if recommendation is too long for a single Flex Message (10KB limit)
  // If too long, split into multiple text messages instead of truncating
  const recommendationMessage = {
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
            text: recommendation,
            wrap: true,
            margin: 'md',
          },
        ],
      },
    },
    quickReply: buildQuickReplies(),
  };

  // Check JSON size
  const messageJson = JSON.stringify([recommendationMessage]);
  const messageSize = Buffer.byteLength(messageJson, 'utf8');

  if (messageSize > 10000) {
    // If too large, send as multiple text messages instead
    const chunkSize = 4000; // Split into chunks of ~4000 characters
    const chunks: string[] = [];
    for (let i = 0; i < recommendation.length; i += chunkSize) {
      chunks.push(recommendation.slice(i, i + chunkSize));
    }

    const messages = chunks.map((chunk, idx) => ({
      type: 'text' as const,
      text: idx === 0 ? `小幽的推薦 ✨\n\n${chunk}` : chunk,
      quickReply: idx === chunks.length - 1 ? buildQuickReplies() : undefined,
    }));

    await sendMessages(userId, messages, replyToken);
  } else {
    await sendMessages(userId, [recommendationMessage], replyToken);
  }
}

export async function sendChatMessage(
  userId: string,
  response: string,
  replyToken?: string,
): Promise<void> {
  await sendMessages(
    userId,
    [
      {
        type: 'text',
        text: response,
        quickReply: buildQuickReplies(),
      },
    ],
    replyToken,
  );
}

export async function sendTodosListMessage(
  userId: string,
  todos: Todo[],
  replyToken?: string,
): Promise<void> {
  if (todos.length === 0) {
    await sendChatMessage(userId, '目前沒有待辦事項呢！', replyToken);
    return;
  }

  if (todos.length === 1) {
    await sendTodoMessage(userId, todos[0], 'listed', replyToken);
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

  await sendMessages(
    userId,
    [
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
              text: truncateFlexText(todoList),
              wrap: true,
              margin: 'md',
              size: 'sm',
            },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
    ],
    replyToken,
  );
}

export async function sendTodosAndMemoriesMessage(
  userId: string,
  todos: Todo[],
  memories: SavedItem[],
  replyToken?: string,
): Promise<void> {
  const parts: string[] = [];
  
  if (todos.length > 0) {
    const todoList = todos
      .map((todo, idx) => {
        const statusText =
          todo.status === 'pending' ? '待處理' : todo.status === 'done' ? '已完成' : '已取消';
        return `${idx + 1}. ${todo.title} (${statusText})`;
      })
      .join('\n');
    parts.push(`📋 待辦事項 (${todos.length} 個):\n${todoList}`);
  }
  
  if (memories.length > 0) {
    // Display full content for memories, but limit each memory to 300 characters to prevent overflow
    const memoryList = memories
      .map((memory, idx) => {
        const displayText = memory.title || memory.content;
        // Limit each memory to 200 characters to ensure we can fit multiple memories
        const truncatedMemory = displayText.length > 300
          ? displayText.slice(0, 300) + '...' 
          : displayText;
        return `${idx + 1}. ${truncatedMemory}`;
      })
      .join('\n\n');
    parts.push(`\n💭 記憶 (${memories.length} 個):\n${memoryList}`);
  }
  
  if (parts.length === 0) {
    await sendChatMessage(userId, '找不到符合條件的待辦事項或記憶呢！', replyToken);
    return;
  }
  
  const combinedText = parts.join('\n');
  
  await sendMessages(
    userId,
    [
    {
      type: 'flex',
      altText: '待辦事項與記憶',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `找到 ${todos.length} 個待辦事項，${memories.length} 個記憶`,
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'separator',
              margin: 'md',
            },
    {
      type: 'text',
              text: truncateFlexText(combinedText, 9000), // Use size-based truncation with 9KB limit for combined content
              wrap: true,
              margin: 'md',
              size: 'sm',
            },
          ],
        },
      },
      quickReply: buildQuickReplies(),
    },
    ],
    replyToken,
  );
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

