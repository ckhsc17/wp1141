import { prisma } from '@/repositories/prismaClient';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number; // Users with conversations in date range
}

export interface ConversationStats {
  totalConversations: number;
  dailyConversations: Array<{ date: string; count: number }>;
}

export interface IntentDistribution {
  intent: string;
  count: number;
  percentage: number;
}

export interface DailyActivity {
  date: string;
  conversations: number;
  users: number;
}

export interface AnalyticsRepository {
  getUserStats(dateRange?: DateRange): Promise<UserStats>;
  getConversationStats(dateRange?: DateRange): Promise<ConversationStats>;
  getIntentDistribution(dateRange?: DateRange): Promise<IntentDistribution[]>;
  getDailyActivity(dateRange?: DateRange): Promise<DailyActivity[]>;
}

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  async getUserStats(dateRange?: DateRange): Promise<UserStats> {
    const totalUsers = await prisma.user.count();

    let activeUsers = totalUsers;
    if (dateRange?.startDate || dateRange?.endDate) {
      const where: any = {
        tags: { has: 'chat' },
      };
      if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) {
          where.createdAt.gte = dateRange.startDate;
        }
        if (dateRange.endDate) {
          where.createdAt.lte = dateRange.endDate;
        }
      }

      const uniqueUserIds = await prisma.savedItem.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      });
      activeUsers = uniqueUserIds.length;
    }

    return {
      totalUsers,
      activeUsers,
    };
  }

  async getConversationStats(dateRange?: DateRange): Promise<ConversationStats> {
    const where: any = {
      tags: { has: 'chat' },
    };

    if (dateRange?.startDate || dateRange?.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) {
        where.createdAt.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.createdAt.lte = dateRange.endDate;
      }
    }

    const totalConversations = await prisma.savedItem.count({ where });

    // Get daily conversation counts
    const conversations = await prisma.savedItem.findMany({
      where,
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<string, number>();
    conversations.forEach((conv) => {
      const date = conv.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    const dailyConversations = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalConversations,
      dailyConversations,
    };
  }

  async getIntentDistribution(dateRange?: DateRange): Promise<IntentDistribution[]> {
    const where: any = {
      tags: { isEmpty: false },
    };

    if (dateRange?.startDate || dateRange?.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) {
        where.createdAt.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.createdAt.lte = dateRange.endDate;
      }
    }

    const items = await prisma.savedItem.findMany({
      where,
      select: {
        tags: true,
      },
    });

    // Count intents from tags (exclude 'chat' tag)
    const intentCounts = new Map<string, number>();
    const intentTags = [
      'insight',
      'knowledge',
      'memory',
      'music',
      'life',
      'link',
      'feedback',
      'recommendation',
      'chat_history',
      'todo',
      'other',
    ];

    items.forEach((item) => {
      const tags = item.tags || [];
      // Find the first matching intent tag
      const intentTag = tags.find((tag) => intentTags.includes(tag.toLowerCase()));
      if (intentTag) {
        const intent = intentTag.toLowerCase();
        intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
      } else if (tags.includes('chat')) {
        // Chat messages are 'other' intent
        intentCounts.set('other', (intentCounts.get('other') || 0) + 1);
      } else if (tags.length > 0) {
        // Other tags might be custom, count as 'other'
        intentCounts.set('other', (intentCounts.get('other') || 0) + 1);
      }
    });

    const total = Array.from(intentCounts.values()).reduce((sum, count) => sum + count, 0);

    const distribution: IntentDistribution[] = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({
        intent,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return distribution;
  }

  async getDailyActivity(dateRange?: DateRange): Promise<DailyActivity[]> {
    const where: any = {
      tags: { has: 'chat' },
    };

    if (dateRange?.startDate || dateRange?.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) {
        where.createdAt.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.createdAt.lte = dateRange.endDate;
      }
    }

    const conversations = await prisma.savedItem.findMany({
      where,
      select: {
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<
      string,
      { conversations: number; userIds: Set<string> }
    >();

    conversations.forEach((conv) => {
      const date = conv.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { conversations: 0, userIds: new Set<string>() };
      existing.conversations += 1;
      existing.userIds.add(conv.userId);
      dailyMap.set(date, existing);
    });

    const dailyActivity: DailyActivity[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        conversations: data.conversations,
        users: data.userIds.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return dailyActivity;
  }
}

