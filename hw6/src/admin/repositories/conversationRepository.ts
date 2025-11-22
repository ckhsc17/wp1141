import { prisma } from '@/repositories/prismaClient';
import type { SavedItem } from '@/domain/schemas';

export interface ConversationFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConversationListResult {
  conversations: SavedItem[];
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
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

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
      prisma.savedItem.count({ where }),
    ]);

    const conversations: SavedItem[] = records.map((item: any) => ({
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

