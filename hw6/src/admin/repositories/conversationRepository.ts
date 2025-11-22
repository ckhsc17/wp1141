import { prisma } from '@/repositories/prismaClient';
import type { SavedItem } from '@/domain/schemas';

export interface ConversationFilters {
  userId?: string;
  userName?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConversationWithUser extends SavedItem {
  userDisplayName?: string;
}

export interface ConversationListResult {
  conversations: ConversationWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversationRepository {
  listConversations(filters: ConversationFilters): Promise<ConversationListResult>;
}

export class PrismaConversationRepository implements ConversationRepository {
  async listConversations(filters: ConversationFilters): Promise<ConversationListResult> {
    const {
      userId,
      userName,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {
      tags: { has: 'chat' },
    };

    if (userId) {
      where.userId = userId;
    }

    // 支援使用者名稱模糊搜尋
    if (userName) {
      where.user = {
        displayName: {
          contains: userName,
          mode: 'insensitive',
        },
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    // 計算總數的 where 條件（不包含 include）
    const countWhere: any = {
      tags: { has: 'chat' },
    };
    if (userId) {
      countWhere.userId = userId;
    }
    if (userName) {
      countWhere.user = {
        displayName: {
          contains: userName,
          mode: 'insensitive',
        },
      };
    }
    if (startDate || endDate) {
      countWhere.createdAt = {};
      if (startDate) {
        countWhere.createdAt.gte = startDate;
      }
      if (endDate) {
        countWhere.createdAt.lte = endDate;
      }
    }
    if (search) {
      countWhere.OR = [
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.savedItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.savedItem.count({ where: countWhere }),
    ]);

    const conversations: ConversationWithUser[] = records.map((item: any) => ({
      id: item.id,
      userId: item.userId,
      title: item.title ?? undefined,
      content: item.content,
      url: item.url ?? undefined,
      tags: item.tags || [],
      metadata: item.metadata ? (item.metadata as Record<string, unknown>) : undefined,
      location: item.location ?? undefined,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      userDisplayName: item.user?.displayName ?? undefined,
    }));

    return {
      conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

