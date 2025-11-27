import type { SavedItemRepository } from '@/repositories';

/**
 * Check if user has exceeded daily message limit
 * @param userId - User ID
 * @param savedItemRepo - SavedItem repository
 * @param dailyLimit - Daily message limit (default: 8)
 * @returns Object with { exceeded: boolean, count: number }
 */
export async function checkDailyMessageLimit(
  userId: string,
  savedItemRepo: SavedItemRepository,
  dailyLimit: number = 8,
): Promise<{ exceeded: boolean; count: number }> {
  // Get today's date string in Asia/Taipei timezone
  const now = new Date();
  const taipeiDateStr = now.toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Taipei',
  }); // Returns YYYY-MM-DD format
  
  // Get all SavedItems (all types: chat, insight, knowledge, memory, music, life, link, etc.)
  // Note: We need to get all items and filter by date since repository doesn't have date filtering
  const allItems = await savedItemRepo.listByUser(userId, 1000);
  
  // Filter items created today (in Taipei timezone)
  const todayItems = allItems.filter((item) => {
    const itemDate = new Date(item.createdAt);
    const itemDateStr = itemDate.toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Taipei',
    }); // Returns YYYY-MM-DD format
    return itemDateStr === taipeiDateStr;
  });

  const count = todayItems.length;
  const exceeded = count >= dailyLimit;

  return { exceeded, count };
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

