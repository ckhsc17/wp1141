import { v4 as uuid } from 'uuid';
import type { Reminder, SavedItem, UserProfile, Todo } from '@/domain/schemas';
import { prisma } from '@/repositories/prismaClient';

export interface UserRepository {
  getById(id: string): Promise<UserProfile | undefined>;
  upsert(profile: UserProfile): Promise<UserProfile>;
}

export interface SavedItemRepository {
  listByUser(userId: string, limit?: number): Promise<SavedItem[]>;
  create(item: Omit<SavedItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedItem>;
  listByTags(userId: string, tags: string[], limit?: number): Promise<SavedItem[]>;
  searchByTags(userId: string, tags: string[], limit?: number): Promise<SavedItem[]>;
  searchByText(userId: string, query: string, limit?: number): Promise<SavedItem[]>;
}

export interface ReminderRepository {
  listPending(userId: string): Promise<Reminder[]>;
  create(reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>): Promise<Reminder>;
}

export interface TodoRepository {
  create(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo>;
  getById(id: string): Promise<Todo | undefined>;
  listByUser(userId: string, status?: Todo['status'], limit?: number): Promise<Todo[]>;
  updateStatus(id: string, status: Todo['status']): Promise<Todo>;
  delete(id: string): Promise<void>;
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

  async listByTags(userId: string, tags: string[], limit = 10): Promise<SavedItem[]> {
    return Array.from(this.items.values())
      .filter(
        (item) =>
          item.userId === userId && tags.some((tag) => item.tags.includes(tag.toLowerCase())),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async searchByTags(userId: string, tags: string[], limit = 10): Promise<SavedItem[]> {
    const lowerTags = tags.map((t) => t.toLowerCase());
    return Array.from(this.items.values())
      .filter(
        (item) =>
          item.userId === userId &&
          lowerTags.some((tag) => item.tags.some((itemTag) => itemTag.toLowerCase().includes(tag))),
      )
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

  async create(item: Omit<SavedItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedItem> {
    const saved: SavedItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
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
        title: item.title ?? undefined,
        content: item.content,
        url: item.url ?? undefined,
        tags: item.tags || [],
        metadata: item.metadata ? (item.metadata as Record<string, unknown>) : undefined,
        location: item.location ?? undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }

  async listByTags(userId: string, tags: string[], limit = 10): Promise<SavedItem[]> {
    const records = await prisma.savedItem.findMany({
      where: {
        userId,
        tags: { hasEvery: tags },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map<SavedItem>((item: any): SavedItem => {
      return {
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
      };
    });
  }

  async searchByTags(userId: string, tags: string[], limit = 10): Promise<SavedItem[]> {
    const records = await prisma.savedItem.findMany({
      where: {
        userId,
        tags: { hasSome: tags },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map<SavedItem>((item: any): SavedItem => {
      return {
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
        title: item.title ?? undefined,
        content: item.content,
        url: item.url ?? undefined,
        tags: item.tags || [],
        metadata: item.metadata ? (item.metadata as Record<string, unknown>) : undefined,
        location: item.location ?? undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }

  async create(item: Omit<SavedItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedItem> {
    const record = await prisma.savedItem.create({
      data: {
        userId: item.userId,
        title: item.title,
        content: item.content,
        rawText: item.content,
        url: item.url,
        tags: item.tags || [],
        metadata: item.metadata ? (item.metadata as any) : undefined,
        location: item.location,
        sentiment: 'NEUTRAL',
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      title: record.title ?? undefined,
      content: record.content,
      url: record.url ?? undefined,
      tags: record.tags || [],
      metadata: record.metadata ? (record.metadata as Record<string, unknown>) : undefined,
      location: record.location ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
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
      description: reminder.description,
      triggerAt: record.triggerAt,
      status: 'pending',
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
      date: todo.date ?? undefined,
      due: todo.due ?? undefined,
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
        date: todo.date ?? null,
        due: todo.due ?? null,
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description ?? undefined,
      status: record.status.toLowerCase() as any,
      date: record.date ?? undefined,
      due: record.due ?? undefined,
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
      date: record.date ?? undefined,
      due: record.due ?? undefined,
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
      date: record.date ?? undefined,
      due: record.due ?? undefined,
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



