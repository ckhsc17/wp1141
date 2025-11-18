import type { TodoRepository } from '@/repositories';
import { TodoSchema, type Todo } from '@/domain/schemas';
import { GeminiService } from './geminiService';
import { logger } from '@/utils/logger';

export class TodoService {
  constructor(
    private readonly todoRepo: TodoRepository,
    private readonly gemini: GeminiService,
  ) {}

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

    const todo = await this.todoRepo.create({
      userId,
      title,
      description,
      status: 'pending',
    });

    logger.info('Todo created', { userId, todoId: todo.id, title });

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

    // Create all todos
    const createdTodos: Todo[] = [];
    for (const todoData of todos) {
      const todo = await this.todoRepo.create({
        userId,
        title: todoData.title,
        description: todoData.description,
        status: 'pending',
      });
      createdTodos.push(TodoSchema.parse(todo));
    }

    logger.info('Multiple todos created', { userId, count: createdTodos.length });

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
      payload: { text },
    });

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
        timeRange: string | null;
        keywords: string[];
        status: 'done' | 'pending' | 'cancelled' | null;
      };

      timeRange = parsed.timeRange;
      keywords = parsed.keywords || [];
      status = parsed.status || null;
    } catch (error) {
      logger.warn('Failed to parse todo query, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Get all todos
    let todos = await this.todoRepo.listByUser(userId);

    // Determine if this is a future time query
    let isFutureTime = false;
    if (timeRange) {
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

    // Filter by time range
    if (timeRange && !isFutureTime) {
      // Only filter by date for past/current time ranges
      // For future time, we return all pending todos (since we don't have dueDate field)
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
          todos = todos.filter((todo) => todo.createdAt >= startDate! && todo.createdAt < endDate!);
        } else {
          todos = todos.filter((todo) => todo.createdAt >= startDate!);
        }
      }
    }

    logger.debug('Todos queried by natural language', {
      userId,
      textPreview: text.slice(0, 100),
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

