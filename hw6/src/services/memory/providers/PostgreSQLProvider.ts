import { PrismaClient } from '@prisma/client';
import type { IMemoryProvider } from '../IMemoryProvider';
import { logger } from '@/utils/logger';

/**
 * PostgreSQL Provider
 * 為未來準備的實作框架
 * 注意：需要 pgvector extension 和 embedding provider
 */
export class PostgreSQLProvider implements IMemoryProvider {
  private prisma: PrismaClient;
  private embeddingProvider?: (text: string) => Promise<number[]>;

  constructor(
    prisma: PrismaClient,
    embeddingProvider?: (text: string) => Promise<number[]>
  ) {
    this.prisma = prisma;
    this.embeddingProvider = embeddingProvider;
  }

  async searchRelevantMemories(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<string> {
    try {
      if (!this.embeddingProvider) {
        logger.warn('Embedding provider not set, falling back to text search');
        // Fallback: 使用文字搜尋
        const savedItems = await this.prisma.savedItem.findMany({
          where: {
            userId,
            OR: [
              { content: { contains: query, mode: 'insensitive' } },
              { title: { contains: query, mode: 'insensitive' } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });

        if (savedItems.length === 0) {
          return '';
        }

        const memoriesText = savedItems
          .map((item, idx) => `${idx + 1}. ${item.title || item.content}`)
          .join('\n');

        return `相關背景記憶：\n${memoriesText}\n`;
      }

      // TODO: 實作向量搜尋（需要 pgvector extension）
      // const queryEmbedding = await this.embeddingProvider(query);
      // const results = await this.prisma.$queryRaw`
      //   SELECT content, 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      //   FROM memories
      //   WHERE user_id = ${userId}
      //   ORDER BY similarity DESC
      //   LIMIT ${limit}
      // `;

      logger.debug('PostgreSQL vector search (not implemented)', {
        userId,
        queryPreview: query.slice(0, 50),
      });

      return '';
    } catch (error) {
      logger.error('PostgreSQL search failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return '';
    }
  }

  async addConversation(
    userId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<void> {
    try {
      // 合併訊息
      const conversationText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      // 儲存到 SavedItem（暫時實作）
      await this.prisma.savedItem.create({
        data: {
          userId,
          content: conversationText,
          title: conversationText.slice(0, 40),
          tags: ['memory'],
          sentiment: 'NEUTRAL',
        },
      });

      logger.debug('PostgreSQL conversation added', {
        userId,
        messagesCount: messages.length,
      });
    } catch (error) {
      logger.error('PostgreSQL add conversation failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async dispose(): Promise<void> {
    // Prisma 不需要清理（shared instance）
  }
}
