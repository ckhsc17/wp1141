import type { TodoRepository, ReminderRepository } from '@/repositories';
import { TodoSchema, type Todo } from '@/domain/schemas';
import { GeminiService } from './geminiService';
import { logger } from '@/utils/logger';

export class TodoService {
  constructor(
    private readonly todoRepo: TodoRepository,
    private readonly reminderRepo: ReminderRepository,
    private readonly gemini: GeminiService,
  ) {}

  /**
   * Extract date and time from natural language text
   */
  private async extractDateTime(text: string): Promise<{ date: Date | null; due: Date | null }> {
    const response = await this.gemini.generate({
      template: 'extractTodoDateTime',
      payload: { text, currentDate: new Date().toISOString() },
    });

    let date: Date | null = null;
    let due: Date | null = null;

    try {
      let jsonStr = response.trim();
      // Remove markdown code blocks
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      // Extract JSON from <JSON> tags
      if (jsonStr.includes('<JSON>')) {
        const match = jsonStr.match(/<JSON>([\s\S]*?)<\/JSON>/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonStr) as {
        date: string | null;
        due: string | null;
      };

      // Parse date
      if (parsed.date && parsed.date !== 'null' && parsed.date !== null) {
        const dateStr = String(parsed.date).trim();
        if (dateStr && dateStr !== 'null') {
          // Check if it's just a date (YYYY-MM-DD) without time
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Parse as date and set to 8:00
            const [year, month, day] = dateStr.split('-').map(Number);
            date = new Date(year, month - 1, day, 8, 0, 0, 0);
          } else {
            // Parse as ISO string
            date = new Date(dateStr);
            // Validate date
            if (isNaN(date.getTime())) {
              logger.warn('Invalid date parsed', { dateStr, textPreview: text.slice(0, 100) });
              date = null;
            }
          }
        }
      }

      // Parse due
      if (parsed.due && parsed.due !== 'null' && parsed.due !== null) {
        const dueStr = String(parsed.due).trim();
        if (dueStr && dueStr !== 'null') {
          // Check if it's just a date (YYYY-MM-DD) without time
          if (dueStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Parse as date and set to 23:59:59
            const [year, month, day] = dueStr.split('-').map(Number);
            due = new Date(year, month - 1, day, 23, 59, 59, 999);
          } else {
            // Parse as ISO string
            due = new Date(dueStr);
            // Validate date
            if (isNaN(due.getTime())) {
              logger.warn('Invalid due date parsed', { dueStr, textPreview: text.slice(0, 100) });
              due = null;
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to parse date time extraction', {
        textPreview: text.slice(0, 100),
        rawResponse: response.slice(0, 500),
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Default: if no date specified, set to today 21:00
    if (!date) {
      const today = new Date();
      today.setHours(21, 0, 0, 0);
      date = today;
    }

    logger.debug('Date time extracted', {
      textPreview: text.slice(0, 100),
      date: date?.toISOString(),
      due: due?.toISOString(),
    });

    return { date, due };
  }

  /**
   * Create a reminder for a todo if it has a date
   */
  private async createReminderForTodo(todo: Todo): Promise<void> {
    if (!todo.date) {
      return;
    }

    try {
      // Check if reminder already exists
      const existingReminders = await this.reminderRepo.listPending(todo.userId);
      const existingReminder = existingReminders.find((r) => r.title === todo.title && r.triggerAt.getTime() === todo.date!.getTime());

      if (existingReminder) {
        logger.debug('Reminder already exists for todo', { todoId: todo.id, reminderId: existingReminder.id });
        return;
      }

      await this.reminderRepo.create({
        userId: todo.userId,
        title: todo.title,
        description: todo.description ?? undefined,
        triggerAt: todo.date,
      });

      logger.info('Reminder created for todo', { todoId: todo.id, triggerAt: todo.date });
    } catch (error) {
      logger.warn('Failed to create reminder for todo', {
        todoId: todo.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async createTodo(userId: string, text: string): Promise<Todo> {
    // Use LLM to extract todo from text
    const response = await this.gemini.generate({
      template: 'createTodo',
      payload: { text },
    });

    let title = text;
    let description: string | undefined;

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      if (jsonStr.includes('<JSON>')) {
        const match = jsonStr.match(/<JSON>([\s\S]*?)<\/JSON>/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonStr) as { title: string; description?: string };
      title = parsed.title || text;
      description = parsed.description;
    } catch (error) {
      logger.warn('Failed to parse todo extraction, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        error: error instanceof Error ? error.message : String(error),
      });
      // Use text as title if parsing fails
      title = text.slice(0, 100);
    }

    // Extract date and time
    const { date, due } = await this.extractDateTime(text);

    const todo = await this.todoRepo.create({
      userId,
      title,
      description,
      status: 'pending',
      date: date ?? undefined,
      due: due ?? undefined,
    });

    // Create reminder if date is set
    if (date) {
      await this.createReminderForTodo(todo);
    }

    logger.info('Todo created', { userId, todoId: todo.id, title, date, due });

    return TodoSchema.parse(todo);
  }

  async createTodos(userId: string, text: string): Promise<Todo[]> {
    // Use LLM to extract multiple todos from text
    const response = await this.gemini.generate({
      template: 'extractMultipleTodos',
      payload: { text },
    });

    let todos: Array<{ title: string; description?: string }> = [];

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      if (jsonStr.includes('<JSON>')) {
        const match = jsonStr.match(/<JSON>([\s\S]*?)<\/JSON>/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonStr) as { todos: Array<{ title: string; description?: string }> };
      todos = parsed.todos || [];
    } catch (error) {
      logger.warn('Failed to parse multiple todos extraction, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback: treat as single todo
      todos = [{ title: text.slice(0, 100) }];
    }

    if (todos.length === 0) {
      todos = [{ title: text.slice(0, 100) }];
    }

    // Extract date and time from the original text (shared for all todos)
    const { date, due } = await this.extractDateTime(text);

    // Create all todos
    const createdTodos: Todo[] = [];
    for (const todoData of todos) {
      const todo = await this.todoRepo.create({
        userId,
        title: todoData.title,
        description: todoData.description,
        status: 'pending',
        date: date ?? undefined,
        due: due ?? undefined,
      });

      // Create reminder if date is set
      if (date) {
        await this.createReminderForTodo(todo);
      }

      createdTodos.push(TodoSchema.parse(todo));
    }

    logger.info('Multiple todos created', { userId, count: createdTodos.length, date, due });

    return createdTodos;
  }

  async updateTodoByNaturalLanguage(userId: string, text: string): Promise<Todo | null> {
    // Get all todos for matching
    const allTodos = await this.todoRepo.listByUser(userId);
    if (allTodos.length === 0) {
      return null;
    }

    // Format todos for LLM
    const todosList = allTodos
      .map((todo, idx) => `${idx + 1}. [${todo.id}] ${todo.title} (${todo.status})`)
      .join('\n');

    const response = await this.gemini.generate({
      template: 'matchTodoForUpdate',
      payload: { text, todos: todosList },
    });

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      if (jsonStr.includes('<JSON>')) {
        const match = jsonStr.match(/<JSON>([\s\S]*?)<\/JSON>/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonStr) as {
        matchedTodoId: string | null;
        action: '完成' | '取消';
        confidence: number;
      };

      if (!parsed.matchedTodoId || parsed.confidence < 0.5) {
        logger.warn('No matching todo found or low confidence', {
          userId,
          textPreview: text.slice(0, 100),
          confidence: parsed.confidence,
        });
        return null;
      }

      // Map action to status
      const status: Todo['status'] = parsed.action === '完成' ? 'done' : 'cancelled';

      const updated = await this.todoRepo.updateStatus(parsed.matchedTodoId, status);
      logger.info('Todo updated by natural language', {
        userId,
        todoId: updated.id,
        action: parsed.action,
        status,
      });

      return TodoSchema.parse(updated);
    } catch (error) {
      logger.warn('Failed to parse todo matching, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback: simple keyword matching
      const lowerText = text.toLowerCase();
      const matchingTodo = allTodos.find((todo) => {
        const todoTitle = todo.title.toLowerCase();
        return (
          (lowerText.includes('完成') || lowerText.includes('寫完') || lowerText.includes('做完')) &&
          (lowerText.includes(todoTitle) || todoTitle.includes(lowerText.replace(/完成|寫完|做完/g, '').trim()))
        );
      });

      if (matchingTodo) {
        const status: Todo['status'] =
          lowerText.includes('取消') || lowerText.includes('不做') ? 'cancelled' : 'done';
        const updated = await this.todoRepo.updateStatus(matchingTodo.id, status);
        return TodoSchema.parse(updated);
      }

      return null;
    }
  }

  async queryTodosByNaturalLanguage(userId: string, text: string): Promise<Todo[]> {
    // Parse query using LLM
    const response = await this.gemini.generate({
      template: 'parseTodoQuery',
      payload: { text, currentDate: new Date().toISOString() },
    });

    let specificDate: string | null = null;
    let timeRange: string | null = null;
    let keywords: string[] = [];
    let status: Todo['status'] | null = null;

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      if (jsonStr.includes('<JSON>')) {
        const match = jsonStr.match(/<JSON>([\s\S]*?)<\/JSON>/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonStr) as {
        specificDate: string | null;
        timeRange: string | null;
        keywords: string[];
        status: 'done' | 'pending' | 'cancelled' | null;
      };

      specificDate = parsed.specificDate;
      timeRange = parsed.timeRange;
      keywords = parsed.keywords || [];
      status = parsed.status || null;
    } catch (error) {
      logger.warn('Failed to parse todo query, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        rawResponse: response.slice(0, 500),
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Get all todos
    let todos = await this.todoRepo.listByUser(userId);

    // Filter by specific date (priority: check date field first, then createdAt)
    if (specificDate) {
      try {
        const [year, month, day] = specificDate.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        const nextDay = new Date(year, month - 1, day + 1);

        todos = todos.filter((todo) => {
          // Check if todo.date matches the specific date
          if (todo.date) {
            const todoDate = new Date(todo.date);
            return todoDate >= targetDate && todoDate < nextDay;
          }
          // Fallback: check createdAt if date is not set
          const todoCreatedAt = new Date(todo.createdAt);
          return todoCreatedAt >= targetDate && todoCreatedAt < nextDay;
        });
      } catch (error) {
        logger.warn('Failed to parse specific date', {
          specificDate,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Determine if this is a future time query (only if no specific date)
    let isFutureTime = false;
    if (!specificDate && timeRange) {
      const futureTimeRanges = ['明天', '下禮拜', '下週', '下個月'];
      isFutureTime = futureTimeRanges.includes(timeRange);
      
      // For future time queries, default to pending status
      if (isFutureTime && !status) {
        status = 'pending';
      }
    }

    // Filter by status
    if (status) {
      todos = todos.filter((todo) => todo.status === status);
    }

    // Filter by keywords
    if (keywords.length > 0) {
      todos = todos.filter((todo) => {
        const todoText = `${todo.title} ${todo.description || ''}`.toLowerCase();
        return keywords.some((keyword) => todoText.includes(keyword.toLowerCase()));
      });
    }

    // Filter by time range (only if no specific date)
    if (!specificDate && timeRange && !isFutureTime) {
      // Only filter by date for past/current time ranges
      // For future time, we return all pending todos
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (timeRange) {
        case '昨天': {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        }
        case '這週':
        case '本週': {
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
          break;
        }
        case '上禮拜':
        case '上週': {
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 7);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
          break;
        }
        case '這個月':
        case '本月': {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        }
        case '上個月': {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        }
        case '今天': {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        }
        default:
          // Unknown time range, return all
          break;
      }

      if (startDate !== null) {
        if (endDate !== null) {
          todos = todos.filter((todo) => {
            // Prefer date field, fallback to createdAt
            const todoDate = todo.date ? new Date(todo.date) : new Date(todo.createdAt);
            return todoDate >= startDate! && todoDate < endDate!;
          });
        } else {
          todos = todos.filter((todo) => {
            const todoDate = todo.date ? new Date(todo.date) : new Date(todo.createdAt);
            return todoDate >= startDate!;
          });
        }
      }
    }

    logger.debug('Todos queried by natural language', {
      userId,
      textPreview: text.slice(0, 100),
      specificDate,
      timeRange,
      keywords,
      status,
      resultCount: todos.length,
    });

    return todos.map((todo) => TodoSchema.parse(todo));
  }

  async listTodos(userId: string, status?: Todo['status']): Promise<Todo[]> {
    const todos = await this.todoRepo.listByUser(userId, status);
    return todos.map((todo) => TodoSchema.parse(todo));
  }

  async updateTodoStatus(todoId: string, status: Todo['status']): Promise<Todo> {
    const todo = await this.todoRepo.updateStatus(todoId, status);
    logger.info('Todo status updated', { todoId, status });
    return TodoSchema.parse(todo);
  }

  async deleteTodo(todoId: string): Promise<void> {
    await this.todoRepo.delete(todoId);
    logger.info('Todo deleted', { todoId });
  }
}

