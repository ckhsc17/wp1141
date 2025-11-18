import { v4 as uuid } from 'uuid';
import type { Insight, Reminder, SavedItem, UserProfile } from '@/domain/schemas';
import { prisma } from '@/repositories/prismaClient';

export interface UserRepository {
  getById(id: string): Promise<UserProfile | undefined>;
  upsert(profile: UserProfile): Promise<UserProfile>;
}

export interface SavedItemRepository {
  listByUser(userId: string, limit?: number): Promise<SavedItem[]>;
  create(item: Omit<SavedItem, 'id' | 'createdAt'>): Promise<SavedItem>;
}

export interface ReminderRepository {
  listPending(userId: string): Promise<Reminder[]>;
  create(reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>): Promise<Reminder>;
}

export interface InsightRepository {
  listRecent(userId: string, limit?: number): Promise<Insight[]>;
  create(insight: Omit<Insight, 'id' | 'createdAt'>): Promise<Insight>;
}

class InMemoryStore<T extends { id: string }> {
  protected items = new Map<string, T>();

  protected generateId(): string {
    return uuid();
  }

  protected save(item: T): T {
    this.items.set(item.id, item);
    return item;
  }
}

// In-memory implementations (現有行為，供無 DB 時使用)

export class InMemoryUserRepository extends InMemoryStore<UserProfile> implements UserRepository {
  async getById(id: string): Promise<UserProfile | undefined> {
    return this.items.get(id);
  }

  async upsert(profile: UserProfile): Promise<UserProfile> {
    const next: UserProfile = {
      ...profile,
      updatedAt: new Date(),
    };
    return this.save(next);
  }
}

export class InMemorySavedItemRepository
  extends InMemoryStore<SavedItem>
  implements SavedItemRepository
{
  async listByUser(userId: string, limit = 5): Promise<SavedItem[]> {
    return Array.from(this.items.values())
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async create(item: Omit<SavedItem, 'id' | 'createdAt'>): Promise<SavedItem> {
    const saved: SavedItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date(),
    };
    return this.save(saved);
  }
}

export class InMemoryReminderRepository
  extends InMemoryStore<Reminder>
  implements ReminderRepository
{
  async listPending(userId: string): Promise<Reminder[]> {
    return Array.from(this.items.values()).filter(
      (reminder) => reminder.userId === userId && reminder.status === 'pending',
    );
  }

  async create(reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>): Promise<Reminder> {
    const created: Reminder = {
      ...reminder,
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date(),
    };
    return this.save(created);
  }
}

export class InMemoryInsightRepository
  extends InMemoryStore<Insight>
  implements InsightRepository
{
  async listRecent(userId: string, limit = 3): Promise<Insight[]> {
    return Array.from(this.items.values())
      .filter((insight) => insight.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async create(insight: Omit<Insight, 'id' | 'createdAt'>): Promise<Insight> {
    const created: Insight = {
      ...insight,
      id: this.generateId(),
      createdAt: new Date(),
    };
    return this.save(created);
  }
}

// Prisma-based skeleton repositories（未連線也不會被使用，只作型別與未來實作的雛形）

export class PrismaUserRepository implements UserRepository {
  async getById(id: string): Promise<UserProfile | undefined> {
    const record = await prisma.user.findUnique({ where: { id } });
    if (!record) return undefined;
    return {
      id: record.id,
      displayName: record.displayName ?? undefined,
      locale: record.locale as UserProfile['locale'],
      timeZone: record.timeZone,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async upsert(profile: UserProfile): Promise<UserProfile> {
    const record = await prisma.user.upsert({
      where: { id: profile.id },
      update: {
        displayName: profile.displayName,
        locale: profile.locale,
        timeZone: profile.timeZone,
      },
      create: {
        id: profile.id,
        displayName: profile.displayName,
        locale: profile.locale,
        timeZone: profile.timeZone,
      },
    });

    return {
      id: record.id,
      displayName: record.displayName ?? undefined,
      locale: record.locale as UserProfile['locale'],
      timeZone: record.timeZone,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export class PrismaSavedItemRepository implements SavedItemRepository {
  async listByUser(userId: string, limit = 5): Promise<SavedItem[]> {
    const records = await prisma.savedItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map<SavedItem>((item: any): SavedItem => {
      return {
        id: item.id,
        userId: item.userId,
        sourceType: item.sourceType.toLowerCase() as any, // Convert from uppercase Prisma enum to lowercase
        title: item.title ?? undefined,
        content: item.content,
        url: item.url ?? undefined,
        category: item.category.toLowerCase() as any, // Convert from uppercase Prisma enum to lowercase
        tags: [],
        createdAt: item.createdAt,
      };
    });
  }

  async create(item: Omit<SavedItem, 'id' | 'createdAt'>): Promise<SavedItem> {
    const record = await prisma.savedItem.create({
      data: {
        userId: item.userId,
        sourceType: item.sourceType.toUpperCase() as any, // Convert to uppercase for Prisma enum
        title: item.title,
        content: item.content,
        rawText: item.content,
        url: item.url,
        category: item.category.toUpperCase() as any, // Convert to uppercase for Prisma enum
        sentiment: 'NEUTRAL',
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      sourceType: record.sourceType.toLowerCase() as any, // Convert from uppercase Prisma enum to lowercase
      title: record.title ?? undefined,
      content: record.content,
      url: record.url ?? undefined,
      category: record.category.toLowerCase() as any, // Convert from uppercase Prisma enum to lowercase
      tags: [],
      createdAt: record.createdAt,
    };
  }
}

export class PrismaReminderRepository implements ReminderRepository {
  async listPending(userId: string): Promise<Reminder[]> {
    const records = await prisma.reminder.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { triggerAt: 'asc' },
    });

    return records.map<Reminder>((r: any): Reminder => {
      return {
        id: r.id,
        userId: r.userId,
        title: r.title,
        description: undefined,
        triggerAt: r.triggerAt,
        status: 'pending',
        createdAt: r.createdAt,
      };
    });
  }

  async create(reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>): Promise<Reminder> {
    const record = await prisma.reminder.create({
      data: {
        userId: reminder.userId,
        title: reminder.title,
        triggerAt: reminder.triggerAt,
        status: 'PENDING',
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: undefined,
      triggerAt: record.triggerAt,
      status: 'pending',
      createdAt: record.createdAt,
    };
  }
}

export class PrismaInsightRepository implements InsightRepository {
  async listRecent(userId: string, limit = 3): Promise<Insight[]> {
    const records = await prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map<Insight>((insight: any): Insight => {
      return {
        id: insight.id,
        userId: insight.userId,
        summary: insight.summary,
        actionItems: [],
        sentiment: (insight.sentiment?.toLowerCase() as any) ?? 'neutral',
        createdAt: insight.createdAt,
      };
    });
  }

  async create(insight: Omit<Insight, 'id' | 'createdAt'>): Promise<Insight> {
    const record = await prisma.insight.create({
      data: {
        userId: insight.userId,
        summary: insight.summary,
        sentiment: 'NEUTRAL',
        detailsJson: insight.actionItems?.join('\n') ?? undefined,
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      summary: record.summary,
      actionItems: insight.actionItems ?? [],
      sentiment: 'neutral',
      createdAt: record.createdAt,
    };
  }
}



