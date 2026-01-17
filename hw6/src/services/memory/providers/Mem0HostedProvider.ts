import { MemoryClient } from 'mem0ai';
import type { IMemoryProvider } from '../IMemoryProvider';
import { logger } from '@/utils/logger';

export class Mem0HostedProvider implements IMemoryProvider {
  private memory: MemoryClient | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.MEM0_API_KEY;
    
    if (!key) {
      logger.warn('MEM0_API_KEY not set, Mem0HostedProvider will not function');
      return;
    }

    try {
      // 使用 Mem0 hosted API
      this.memory = new MemoryClient({
        apiKey: key,
        // 使用 hosted service，無需配置 vector store
      });
      
      logger.info('Mem0HostedProvider initialized successfully', {
        hasApiKey: !!key,
        apiKeyLength: key?.length || 0,
      });
    } catch (error) {
      logger.error('Failed to initialize Mem0HostedProvider', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.memory = null;
    }
  }

  async searchRelevantMemories(
    userId: string,
    query: string,
    limit: number = 5,
    categories?: string[]
  ): Promise<string> {
    try {
      if (!this.memory) {
        logger.warn('Mem0 not initialized, returning empty memories', {
          userId,
          queryPreview: query.slice(0, 50),
        });
        return '';
      }

      // search(query: string, options?: SearchOptions)
      // 如果有指定 categories，使用 categories 過濾（精準檢索）
      const searchOptions: any = {
        user_id: userId,
        limit,
      };

      if (categories && categories.length > 0) {
        // Mem0 的 SearchOptions 支援 categories 參數
        searchOptions.categories = categories;
        logger.debug('Searching with categories filter', {
          userId,
          categories,
          queryPreview: query.slice(0, 50),
        });
      }

      const results = await this.memory.search(query, searchOptions);

      if (!results || results.length === 0) {
        return '';
      }

      // 格式化記憶為 context string
      // results 是 Array<Memory>，每個 Memory 有 memory 屬性
      const memoriesText = results
        .map((entry: any, idx: number) => {
          const memory = entry.memory || entry.data?.memory || '';
          return `${idx + 1}. ${memory}`;
        })
        .join('\n');

      logger.info('Mem0 search successful', {
        userId,
        queryPreview: query.slice(0, 50),
        resultsCount: results.length,
        categoriesFilter: categories || 'none',
      });

      return `相關背景記憶：\n${memoriesText}\n`;
    } catch (error) {
      logger.error('Mem0 search failed', {
        userId,
        queryPreview: query.slice(0, 50),
        error: error instanceof Error ? error.message : String(error),
      });
      return ''; // Fallback: 失敗時返回空字串，不影響主流程
    }
  }

  async addConversation(
    userId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    category?: string
  ): Promise<void> {
    try {
      if (!this.memory) {
        logger.warn('Mem0 not initialized, skipping conversation add', {
          userId,
          messagesCount: messages.length,
        });
        return;
      }

      // add(messages: Array<Message>, options?: MemoryOptions)
      // 如果有指定 category，傳入 categories 參數（避免記憶污染）
      const addOptions: any = {
        user_id: userId,
      };

      if (category) {
        // Mem0 的 MemoryOptions 支援 categories 參數（陣列格式）
        addOptions.categories = [category];
        logger.debug('Adding conversation with category', {
          userId,
          category,
        });
      }

      await this.memory.add(messages, addOptions);

      logger.info('Mem0 conversation added successfully', {
        userId,
        messagesCount: messages.length,
        category: category || 'none',
        userMessagePreview: messages.find(m => m.role === 'user')?.content.slice(0, 50),
        assistantMessagePreview: messages.find(m => m.role === 'assistant')?.content.slice(0, 50),
      });
    } catch (error) {
      logger.error('Mem0 add conversation failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      // 不拋出錯誤，避免影響主流程
    }
  }

  async dispose(): Promise<void> {
    // Mem0 hosted 不需要清理
  }
}
