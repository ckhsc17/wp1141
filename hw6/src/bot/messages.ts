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
 * This function tries to truncate at line break boundaries to preserve formatting
 * 
 * @param text - Text to truncate
 * @param maxBytes - Maximum size in bytes (default: 8000)
 * @returns Truncated text with ellipsis if needed
 */
function truncateFlexText(text: string, maxBytes: number = 8000): string {
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

  // Try to truncate at a line break boundary if possible
  const truncated = text.slice(0, bestLength);
  const lastNewline = truncated.lastIndexOf('\n');
  
  // If we can truncate at a newline and still fit within limit, do so
  if (lastNewline > bestLength * 0.8) { // Only if we're not losing too much content
    const newlineTruncated = text.slice(0, lastNewline) + '...';
    if (getJsonStringSize(newlineTruncated) <= maxBytes) {
      return newlineTruncated;
    }
  }

  return truncated + '...';
}

/**
 * Split text into multiple text components for Flex Message
 * This is useful when text is too long for a single component or contains many line breaks
 * 
 * @param text - Text to split
 * @param maxBytesPerComponent - Maximum size in bytes per component (default: 7000)
 * @returns Array of text components
 */
function splitTextIntoComponents(
  text: string,
  maxBytesPerComponent: number = 7000,
): Array<{ type: 'text'; text: string; wrap: boolean; size?: string; color?: string; margin?: string }> {
  // If text fits in one component, return it
  if (getJsonStringSize(text) <= maxBytesPerComponent) {
    return [{ type: 'text', text, wrap: true }];
  }

  const components: Array<{ type: 'text'; text: string; wrap: boolean; size?: string; color?: string; margin?: string }> = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    const testChunk = currentChunk ? `${currentChunk}\n${line}` : line;
    const testSize = getJsonStringSize(testChunk);

    if (testSize <= maxBytesPerComponent) {
      currentChunk = testChunk;
    } else {
      // Save current chunk if it has content
      if (currentChunk) {
        components.push({ type: 'text', text: currentChunk, wrap: true });
      }

      // If single line is too long, truncate it
      if (getJsonStringSize(line) > maxBytesPerComponent) {
        const truncated = truncateFlexText(line, maxBytesPerComponent);
        components.push({ type: 'text', text: truncated, wrap: true });
        currentChunk = '';
      } else {
        currentChunk = line;
      }
    }
  }

  // Add remaining chunk
  if (currentChunk) {
    components.push({ type: 'text', text: currentChunk, wrap: true });
  }

  return components.length > 0 ? components : [{ type: 'text', text: truncateFlexText(text, maxBytesPerComponent), wrap: true }];
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
    label: '👻 查看幽靈幣',
    text: '查看幽靈幣數量',
  },
  {
    label: '💡 功能許願池',
    uri: 'https://app.sli.do/event/6GB5Y4xYAbbEzfkSF4rZRh/live/questions',
  },

  // {
  //   label: '👤 我的',
  //   uri: LIFF_DASHBOARD_URL,
  // },
  // {
  //   label: '⚙️ 設定',
  //   uri: LIFF_SETTINGS_URL,
  // },
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
      text: '嗨，我是 Booboo 小幽 👋 想記錄靈感、設定提醒或聽聽建議，都可以跟我說！最近有點太多人找我，如果看到我回你我在忙，代表我的 token 快用完了，我需要休息一下，請隔最多一天之後我就會恢復精力啦！... \n範例：\n- 「幫我記下今天看到的文章 https://...」\n- 「提醒我明天 9 點要寫日記」\n- 「幫我整理最近的想法」',
      quickReply: buildQuickReplies(),
    },
    ],
    replyToken,
  );
}

export async function sendCoinCountMessage(
  userId: string,
  currentCount: number,
  dailyLimit: number = 8,
  replyToken?: string,
): Promise<void> {
  const percentage = Math.min((currentCount / dailyLimit) * 100, 100);
  const remaining = Math.max(dailyLimit - currentCount, 0);
  
  // Determine color based on usage
  let progressColor = '#4CAF50'; // Green
  if (percentage >= 75) {
    progressColor = '#FF9800'; // Orange
  }
  if (percentage >= 90) {
    progressColor = '#F44336'; // Red
  }
  
  await sendMessages(
    userId,
    [
      {
        type: 'flex',
        altText: `幽靈幣用量：${currentCount}/${dailyLimit}`,
        contents: {
          type: 'bubble',
          hero: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '👻 幽靈幣',
                weight: 'bold',
                size: 'xl',
                color: '#FFFFFF',
                align: 'center',
              },
            ],
            backgroundColor: '#9C27B0',
            paddingAll: '20px',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: `今日用量`,
                    size: 'sm',
                    color: '#666666',
                  },
                  {
                    type: 'text',
                    text: `${currentCount} / ${dailyLimit}`,
                    weight: 'bold',
                    size: 'xxl',
                    color: '#333333',
                  },
                ],
              },
              {
                type: 'separator',
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'xs',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'box',
                        layout: 'vertical',
                        flex: Math.max(currentCount, 1),
                        backgroundColor: progressColor,
                        height: '20px',
                        cornerRadius: '10px',
                        contents: [
                          {
                            type: 'text',
                            text: ' ',
                            size: 'xs',
                          },
                        ],
                      },
                      {
                        type: 'box',
                        layout: 'vertical',
                        flex: Math.max(remaining, 1),
                        backgroundColor: '#E0E0E0',
                        height: '20px',
                        cornerRadius: '10px',
                        contents: [
                          {
                            type: 'text',
                            text: ' ',
                            size: 'xs',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: 'text',
                text: remaining > 0 ? `還剩 ${remaining} 次可以使用` : '今天的幽靈幣已用完',
                size: 'sm',
                color: remaining > 0 ? '#4CAF50' : '#F44336',
                align: 'center',
                margin: 'md',
                weight: 'bold',
              },
            ],
            paddingAll: '20px',
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '💡 提示：只有觸發 Gemini API 的訊息才會計算用量',
                size: 'xs',
                color: '#999999',
                align: 'center',
                wrap: true,
                margin: 'sm',
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
                  text: '「個人生活記錄與 AI 助手」',
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm',
                },
                {
                  type: 'text',
                  text: '大家平常會不會有只有自己的 LINE 群組？',
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm',
                },
                {
                  type: 'text',
                  text: '會在裡面傳連結或任何很突然的想法？',
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '這就是聰明的 me 群組機器人！',
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm',
                },
                {
                  type: 'text',
                  text: '可以幫你整理待辦靈感、知識、記憶，並提供個人化的回饋與推薦。',
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '直接和小幽用自然語言對話吧～',
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
                  text: '*待辦事項通知因目前為 Vercel 免費版，',
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm',
                },
                {
                  type: 'text',
                  text: ' 只能每天通知一次（設定在 08:00）。',
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
                  text: '新增：Ex. 明天寫網服作業、明天 21:00 寫日記',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '更新：Ex. 我寫完網服作業了！',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: '查詢：Ex. 明天要幹嘛？',
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
                  text: 'Ex. https://bowenchen.vercel.app/',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'separator',
                  margin: 'md',
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
                  text: '隨手隨時記錄頓悟和啟發',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: 'Ex. 街頭攝影不一定要有人；只要有人跡就夠了',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'separator',
                  margin: 'md',
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
                  text: 'Ex. 小幽用了 intent classification 和 RAG 技術，可以更聰明地回答你的問題',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'separator',
                  margin: 'md',
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
                {
                  type: 'text',
                  text: 'Ex. 今天跟朋友聊到當一年兵的事情...',
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
                  text: '記錄想練習/覺得好聽的歌曲',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: 'Ex. 陶喆 二十二、盧廣仲 大人中',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'separator',
                  margin: 'md',
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
                  text: 'Ex. 想去看動物方城市 3',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'separator',
                  margin: 'md',
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
                  text: 'Ex. 給我一些生活建議 / 幫我分析時間管理 / 我最近過得怎麼樣？',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'separator',
                  margin: 'md',
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
                  text: 'Ex. 推薦一些技術文章 / 展覽 / 音樂',
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true,
                },
                {
                  type: 'separator',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: '🔍 對話紀錄/記憶查詢',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: 'Ex. 我有沒有聊過 XXX？ / 我上禮拜說了什麼？ / 之前提到的作業是什麼？',
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
  options?: {
    title?: string;
    showStatus?: boolean;
  },
): Promise<void> {
  if (todos.length === 0) {
    await sendChatMessage(userId, '目前沒有待辦事項呢！', replyToken);
    return;
  }

  if (todos.length === 1) {
    await sendTodoMessage(userId, todos[0], 'listed', replyToken);
    return;
  }

  const title = options?.title ?? `找到 ${todos.length} 個待辦事項`;
  const showStatus = options?.showStatus ?? true;

  // For multiple todos, send a carousel or formatted list
  const todoList = todos
    .map((todo, idx) => {
      if (showStatus) {
        const statusText =
          todo.status === 'pending' ? '待處理' : todo.status === 'done' ? '已完成' : '已取消';
        return `${idx + 1}. ${todo.title} (${statusText})`;
      } else {
        return `${idx + 1}. ${todo.title}`;
      }
    })
    .join('\n');

  // Check if text is too long for a single component
  const textComponents = splitTextIntoComponents(todoList, 7000);
  
  // If text fits in one component, use simple flex message
  if (textComponents.length === 1) {
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
                  text: title,
                  weight: 'bold',
                  size: 'md',
                },
                {
                  type: 'separator',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: textComponents[0].text,
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
  } else {
    // If text is too long, send as multiple text messages to preserve formatting
    const messages = textComponents.map((component, idx) => ({
      type: 'text' as const,
      text: idx === 0 ? `${title}\n\n${component.text}` : component.text,
      quickReply: idx === textComponents.length - 1 ? buildQuickReplies() : undefined,
    }));
    
    await sendMessages(userId, messages, replyToken);
  }
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
  
  // Check if text is too long for a single component
  const textComponents = splitTextIntoComponents(combinedText, 7000);
  
  // If text fits in one component, use simple flex message
  if (textComponents.length === 1) {
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
                  text: textComponents[0].text,
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
  } else {
    // If text is too long, send as multiple text messages to preserve formatting
    const messages = textComponents.map((component, idx) => ({
      type: 'text' as const,
      text: idx === 0 ? `找到 ${todos.length} 個待辦事項，${memories.length} 個記憶\n\n${component.text}` : component.text,
      quickReply: idx === textComponents.length - 1 ? buildQuickReplies() : undefined,
    }));
    
    await sendMessages(userId, messages, replyToken);
  }
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

