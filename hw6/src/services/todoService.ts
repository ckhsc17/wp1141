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

