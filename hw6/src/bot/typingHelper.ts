import type LineContext from 'bottender/dist/line/LineContext';
import { lineClient } from './lineBot';
import { logger } from '@/utils/logger';

/**
 * Show loading indicator (loading animation) to user
 * 
 * According to LINE Messaging API documentation:
 * - Endpoint: POST /v2/bot/chat/loading/start
 * - Body: { "chatId": userId, "loadingSeconds": number }
 * - The loading indicator will automatically disappear after loadingSeconds or when a message is sent
 * 
 * Reference: https://developers.line.biz/en/reference/messaging-api/#display-a-loading-indicator
 * 
 * @param context - Bottender LineContext (preferred method)
 * @param userId - LINE user ID (fallback if context is not available)
 * @param loadingSeconds - Duration in seconds (default: 5, max: 60)
 */
export async function showTyping(
  context?: LineContext,
  userId?: string,
  loadingSeconds: number = 20,
): Promise<void> {
  try {
    // Get userId from context if not provided
    if (!userId && context?.event?.source?.userId) {
      userId = context.event.source.userId;
    }

    if (!userId) {
      logger.warn('Cannot show loading indicator: userId is required');
      return;
    }

    // Clamp loadingSeconds between 1 and 60 (LINE API limit)
    const clampedSeconds = Math.max(1, Math.min(60, loadingSeconds));

    // Method 1: Try Bottender context method (if available)
    if (context && typeof (context as any).sendTyping === 'function') {
      try {
        await (context as any).sendTyping();
        logger.debug('Loading indicator shown via context.sendTyping()', { userId, loadingSeconds: clampedSeconds });
        return;
      } catch (error) {
        logger.debug('context.sendTyping() failed, falling back to API call', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Method 2: Use LINE Messaging API directly via lineClient.axios
    // Reference: https://developers.line.biz/en/reference/messaging-api/#display-a-loading-indicator
    const axios = (lineClient as any).axios;
    if (axios) {
      try {
        // LINE Messaging API: POST /v2/bot/chat/loading/start
        // Body: { "chatId": userId, "loadingSeconds": number }
        await axios.post('/v2/bot/chat/loading/start', {
          chatId: userId,
          loadingSeconds: clampedSeconds,
        });
        logger.debug('Loading indicator shown via LINE API', { userId, loadingSeconds: clampedSeconds });
        return;
      } catch (apiError) {
        logger.warn('Failed to show loading indicator via LINE API', {
          userId,
          loadingSeconds: clampedSeconds,
          error: apiError instanceof Error ? apiError.message : String(apiError),
          response: (apiError as any)?.response?.data,
        });
        throw apiError; // Re-throw to be caught by outer catch
      }
    }

    logger.warn('Could not show loading indicator - no valid method found', {
      hasContext: !!context,
      hasUserId: !!userId,
      hasAxios: !!axios,
    });
  } catch (error) {
    // Log error but don't throw - loading indicator is not critical for functionality
    logger.warn('Failed to show loading indicator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasContext: !!context,
      userId,
    });
  }
}

