import { v4 as uuid } from 'uuid';
import type { Insight, Reminder, SavedItem, UserProfile, Todo, JournalEntry } from '@/domain/schemas';
import { prisma } from '@/repositories/prismaClient';

export interface UserRepository {
  getById(id: string): Promise<UserProfile | undefined>;
  upsert(profile: UserProfile): Promise<UserProfile>;
}

export interface SavedItemRepository {
  listByUser(userId: string, limit?: number): Promise<SavedItem[]>;
  create(item: Omit<SavedItem, 'id' | 'createdAt'>): Promise<SavedItem>;
  listByCategory(userId: string, category: SavedItem['category'], limit?: number): Promise<SavedItem[]>;
  searchByText(userId: string, query: string, limit?: number): Promise<SavedItem[]>;
}

export interface ReminderRepository {
  listPending(userId: string): Promise<Reminder[]>;
  create(reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>): Promise<Reminder>;
}

export interface InsightRepository {
  listRecent(userId: string, limit?: number): Promise<Insight[]>;
  create(insight: Omit<Insight, 'id' | 'createdAt'>): Promise<Insight>;
}

export interface TodoRepository {
  create(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo>;
  getById(id: string): Promise<Todo | undefined>;
  listByUser(userId: string, status?: Todo['status'], limit?: number): Promise<Todo[]>;
  updateStatus(id: string, status: Todo['status']): Promise<Todo>;
  delete(id: string): Promise<void>;
}

export interface JournalRepository {
  create(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry>;
  getById(id: string): Promise<JournalEntry | undefined>;
  listByUser(userId: string, limit?: number): Promise<JournalEntry[]>;
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

  async listByCategory(userId: string, category: SavedItem['category'], limit = 10): Promise<SavedItem[]> {
    return Array.from(this.items.values())
      .filter((item) => item.userId === userId && item.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async searchByText(userId: string, query: string, limit = 10): Promise<SavedItem[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.items.values())
      .filter(
        (item) =>
          item.userId === userId &&
          (item.title?.toLowerCase().includes(lowerQuery) || item.content.toLowerCase().includes(lowerQuery)),
      )
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

  async listByCategory(userId: string, category: SavedItem['category'], limit = 10): Promise<SavedItem[]> {
    const records = await prisma.savedItem.findMany({
      where: {
        userId,
        category: category.toUpperCase() as any,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map<SavedItem>((item: any): SavedItem => {
      return {
        id: item.id,
        userId: item.userId,
        sourceType: item.sourceType.toLowerCase() as any,
        title: item.title ?? undefined,
        content: item.content,
        url: item.url ?? undefined,
        category: item.category.toLowerCase() as any,
        tags: [],
        createdAt: item.createdAt,
      };
    });
  }

  async searchByText(userId: string, query: string, limit = 10): Promise<SavedItem[]> {
    const records = await prisma.savedItem.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map<SavedItem>((item: any): SavedItem => {
      return {
        id: item.id,
        userId: item.userId,
        sourceType: item.sourceType.toLowerCase() as any,
        title: item.title ?? undefined,
        content: item.content,
        url: item.url ?? undefined,
        category: item.category.toLowerCase() as any,
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

// Todo Repository Implementations

export class InMemoryTodoRepository extends InMemoryStore<Todo> implements TodoRepository {
  async create(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    const created: Todo = {
      ...todo,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.save(created);
  }

  async getById(id: string): Promise<Todo | undefined> {
    return this.items.get(id);
  }

  async listByUser(userId: string, status?: Todo['status'], limit = 10): Promise<Todo[]> {
    let todos = Array.from(this.items.values()).filter((todo) => todo.userId === userId);
    if (status) {
      todos = todos.filter((todo) => todo.status === status);
    }
    return todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  async updateStatus(id: string, status: Todo['status']): Promise<Todo> {
    const todo = this.items.get(id);
    if (!todo) {
      throw new Error(`Todo with id ${id} not found`);
    }
    const updated: Todo = {
      ...todo,
      status,
      updatedAt: new Date(),
    };
    return this.save(updated);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

export class PrismaTodoRepository implements TodoRepository {
  async create(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    const record = await prisma.todo.create({
      data: {
        userId: todo.userId,
        title: todo.title,
        description: todo.description,
        status: todo.status.toUpperCase() as any,
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description ?? undefined,
      status: record.status.toLowerCase() as any,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async getById(id: string): Promise<Todo | undefined> {
    const record = await prisma.todo.findUnique({ where: { id } });
    if (!record) return undefined;

    return {
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description ?? undefined,
      status: record.status.toLowerCase() as any,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async listByUser(userId: string, status?: Todo['status'], limit = 10): Promise<Todo[]> {
    const records = await prisma.todo.findMany({
      where: {
        userId,
        ...(status ? { status: status.toUpperCase() as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description ?? undefined,
      status: record.status.toLowerCase() as any,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async updateStatus(id: string, status: Todo['status']): Promise<Todo> {
    const record = await prisma.todo.update({
      where: { id },
      data: { status: status.toUpperCase() as any },
    });

    return {
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description ?? undefined,
      status: record.status.toLowerCase() as any,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.todo.delete({ where: { id } });
  }
}

// Journal Repository Implementations

export class InMemoryJournalRepository extends InMemoryStore<JournalEntry> implements JournalRepository {
  async create(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const created: JournalEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.save(created);
  }

  async getById(id: string): Promise<JournalEntry | undefined> {
    return this.items.get(id);
  }

  async listByUser(userId: string, limit = 10): Promise<JournalEntry[]> {
    return Array.from(this.items.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export class PrismaJournalRepository implements JournalRepository {
  async create(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const record = await prisma.journalEntry.create({
      data: {
        userId: entry.userId,
        content: entry.content,
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      content: record.content,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async getById(id: string): Promise<JournalEntry | undefined> {
    const record = await prisma.journalEntry.findUnique({ where: { id } });
    if (!record) return undefined;

    return {
      id: record.id,
      userId: record.userId,
      content: record.content,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async listByUser(userId: string, limit = 10): Promise<JournalEntry[]> {
    const records = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      content: record.content,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }
}


