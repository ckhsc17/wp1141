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
 * @param userId - LINE user ID
 * @param loadingSeconds - Duration in seconds (default: 20, max: 60)
 */
export async function showTyping(
  userId: string,
  loadingSeconds: number = 20,
): Promise<void> {
  try {
    if (!userId) {
      logger.warn('Cannot show loading indicator: userId is required');
      return;
    }

    // Clamp loadingSeconds between 1 and 60 (LINE API limit)
    const clampedSeconds = Math.max(1, Math.min(60, loadingSeconds));

    // Use LINE Messaging API directly via lineClient.axios
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

    logger.warn('Could not show loading indicator - axios not available', {
      hasUserId: !!userId,
      hasAxios: !!axios,
    });
  } catch (error) {
    // Log error but don't throw - loading indicator is not critical for functionality
    logger.warn('Failed to show loading indicator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
    });
  }
}

