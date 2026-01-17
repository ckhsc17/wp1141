import type { LineClient } from 'messaging-api-line';
import type { UserRepository } from '@/repositories';
import type { UserProfile } from '@/domain/schemas';
import { logger } from '@/utils/logger';

/**
 * Maps LINE language code to UserProfile locale
 */
function mapLineLanguageToLocale(language?: string): UserProfile['locale'] {
  if (language === 'en') return 'en-US';
  return 'zh-TW'; // Default to zh-TW for ja, zh, or undefined
}

/**
 * Ensures a user exists in the database. If not, fetches user info from LINE API and creates the record.
 * If the operation fails, logs the error but does not throw (graceful degradation).
 *
 * @param userId - LINE user ID
 * @param lineClient - LINE API client instance
 * @param userRepo - User repository instance
 */
export async function ensureUser(
  userId: string,
  lineClient: LineClient,
  userRepo: UserRepository,
): Promise<void> {
  try {
    // Check if user already exists
    const existingUser = await userRepo.getById(userId);
    if (existingUser) {
      // User exists, no need to create
      return;
    }

    // User doesn't exist, fetch from LINE API
    logger.debug('User not found in database, fetching from LINE API', { userId });

    const lineProfile = await lineClient.getUserProfile(userId);

    // Map LINE profile to UserProfile
    const userProfile: UserProfile = {
      id: lineProfile.userId,
      displayName: lineProfile.displayName ?? undefined,
      locale: mapLineLanguageToLocale(lineProfile.language),
      timeZone: 'Asia/Taipei', // Default timezone
      isVIP: false, // Default to non-VIP
      tokenLimit: null, // Default to null (use default limit)
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Upsert user (create or update)
    await userRepo.upsert(userProfile);

    logger.info('User created successfully', {
      userId,
      displayName: userProfile.displayName,
      locale: userProfile.locale,
    });
  } catch (error) {
    // Log error but don't throw - allow message processing to continue
    logger.error('Failed to ensure user', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

