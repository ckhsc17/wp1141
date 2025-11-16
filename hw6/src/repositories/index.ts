import { v4 as uuid } from 'uuid';
import type { Insight, Reminder, SavedItem, UserProfile } from '@/domain/schemas';

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


