import type { SavedItemRepository, UserRepository } from '@/repositories';
import { SystemSettingsRepository } from '@/repositories/systemSettingsRepository';

const settingsRepo = new SystemSettingsRepository();

/**
 * Get user's token limit based on VIP status and custom limit
 * @param userRepo - User repository
 * @param userId - User ID
 * @returns User's token limit (number)
 */
async function getUserTokenLimit(userRepo: UserRepository, userId: string): Promise<number> {
  const user = await userRepo.getById(userId);
  
  // If user has custom tokenLimit, use it
  if (user && user.tokenLimit !== null && user.tokenLimit !== undefined) {
    return user.tokenLimit;
  }

  // Get default settings from database (or env vars as fallback)
  const settings = await settingsRepo.getSettings();

  // Use default based on VIP status
  if (user?.isVIP) {
    return settings.vipTokenLimit;
  }

  return settings.regularTokenLimit;
}

/**
 * Check if user has exceeded daily API call limit
 * Only counts messages that trigger Gemini API (not intent classification)
 * @param userId - User ID
 * @param savedItemRepo - SavedItem repository
 * @param userRepo - User repository (for getting user's token limit)
 * @param dailyLimit - Daily API call limit (optional, will be fetched from user if not provided)
 * @returns Object with { exceeded: boolean, count: number, limit: number }
 */
export async function checkDailyMessageLimit(
  userId: string,
  savedItemRepo: SavedItemRepository,
  userRepo: UserRepository,
  dailyLimit?: number,
): Promise<{ exceeded: boolean; count: number; limit: number }> {
  // If dailyLimit is not provided, fetch from user profile
  const limit = dailyLimit ?? (await getUserTokenLimit(userRepo, userId));
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
  const exceeded = count >= limit;

  return { exceeded, count, limit };
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

