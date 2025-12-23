import prisma from './prisma';

/**
 * Generate a unique userId from email
 * Format: email前綴 + "_" + 三個字母數字亂碼
 * Example: "john_abc", "jane_xyz"
 */
export async function generateUserId(email: string): Promise<string> {
  // Extract email prefix (part before @)
  const emailPrefix = email.split('@')[0].toLowerCase();
  
  // Generate random 3-character alphanumeric string
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const generateRandom = () => {
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  // Ensure uniqueness by checking database
  let userId: string;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loop
  
  while (exists && attempts < maxAttempts) {
    const randomSuffix = generateRandom();
    userId = `${emailPrefix}_${randomSuffix}`;
    
    const existingUser = await prisma.user.findUnique({
      where: { userId },
      select: { id: true },
    });
    
    exists = !!existingUser;
    attempts++;
  }
  
  if (exists) {
    // Fallback: use timestamp if all attempts failed
    const timestamp = Date.now().toString(36).slice(-3);
    userId = `${emailPrefix}_${timestamp}`;
  }
  
  return userId!;
}

/**
 * Get user's userId (string) from user ID (number)
 * Returns user's userId string, or null if not found
 */
export async function getUserUserId(userId: number): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userId: true },
  });
  return user?.userId || null;
}

/**
 * Get user name from user ID
 * Returns user's name or email, or 'Unknown' if not found
 */
export async function getUserName(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return user?.name || user?.email || 'Unknown';
}

/**
 * Get user name from userId string
 * Returns user's name or email, or 'Unknown' if not found
 */
export async function getUserNameByUserId(userIdString: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { userId: userIdString },
    select: { name: true, email: true },
  });
  return user?.name || user?.email || 'Unknown';
}

/**
 * Get or create anonymous user identifier from session
 * Returns a consistent identifier for anonymous users
 */
export function getAnonymousUserId(sessionId?: string): string {
  if (sessionId) {
    return `anonymous_${sessionId}`;
  }
  // Fallback: generate a simple ID (in production, use proper session ID)
  return `anonymous_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

