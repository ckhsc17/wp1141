import type { SavedItemRepository } from '@/repositories';

/**
 * Check if user has exceeded daily API call limit
 * Only counts messages that trigger Gemini API (not intent classification)
 * @param userId - User ID
 * @param savedItemRepo - SavedItem repository
 * @param dailyLimit - Daily API call limit (default: 8)
 * @returns Object with { exceeded: boolean, count: number }
 */
export async function checkDailyMessageLimit(
  userId: string,
  savedItemRepo: SavedItemRepository,
  dailyLimit: number = 1000,
): Promise<{ exceeded: boolean; count: number }> {
  // Get today's date string in Asia/Taipei timezone
  const now = new Date();
  const taipeiDateStr = now.toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Taipei',
  }); // Returns YYYY-MM-DD format
  
  // Get all API call records (tagged with 'api_call')
  // Note: We need to get all items and filter by date since repository doesn't have date filtering
  const allApiCalls = await savedItemRepo.listByTags(userId, ['api_call'], 1000);
  
  // Filter API calls made today (in Taipei timezone)
  const todayApiCalls = allApiCalls.filter((item) => {
    const itemDate = new Date(item.createdAt);
    const itemDateStr = itemDate.toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Taipei',
    }); // Returns YYYY-MM-DD format
    return itemDateStr === taipeiDateStr;
  });

  const count = todayApiCalls.length;
  const exceeded = count >= dailyLimit;

  return { exceeded, count };
}

/**
 * Record an API call for message limit tracking
 * @param userId - User ID
 * @param savedItemRepo - SavedItem repository
 * @param intent - Intent type that triggered the API call
 */
export async function recordApiCall(
  userId: string,
  savedItemRepo: SavedItemRepository,
  intent: string,
): Promise<void> {
  await savedItemRepo.create({
    userId,
    title: `API call: ${intent}`,
    content: `API call recorded for intent: ${intent}`,
    tags: ['api_call'],
  });
}

/**
 * Check if error is a 429 Too Many Requests error
 * @param error - Error object
 * @returns boolean
 */
export function isTooManyRequestsError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';

  return (
    errorMessage.includes('429') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('quota exceeded') ||
    errorMessage.includes('exceeded your current quota') ||
    errorStack.includes('429') ||
    errorStack.includes('too many requests') ||
    errorStack.includes('quota exceeded')
  );
}

