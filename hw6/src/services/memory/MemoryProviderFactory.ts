import type { IMemoryProvider } from './IMemoryProvider';
import { Mem0HostedProvider } from './providers/Mem0HostedProvider';
import { UpstashProvider } from './providers/UpstashProvider';
import { PostgreSQLProvider } from './providers/PostgreSQLProvider';
import { prisma } from '@/repositories/prismaClient';
import { logger } from '@/utils/logger';

export type MemoryProviderType = 'mem0' | 'upstash' | 'postgresql' | 'none';

/**
 * Memory Provider Factory
 * 根據環境變數或配置創建對應的 Provider 實例
 */
export class MemoryProviderFactory {
  /**
   * 創建 Memory Provider
   * @param type Provider 類型（如果不指定，從環境變數讀取）
   * @returns IMemoryProvider 實例，或 null（如果類型為 'none'）
   */
  static create(type?: MemoryProviderType): IMemoryProvider | null {
    const providerType = type || (process.env.MEMORY_PROVIDER as MemoryProviderType) || 'mem0';

    logger.info('Creating memory provider', { type: providerType });

    switch (providerType) {
      case 'mem0': {
        const apiKey = process.env.MEM0_API_KEY;
        if (!apiKey) {
          logger.warn('MEM0_API_KEY not set, memory features will be disabled', {
            providerType: 'mem0',
            envVar: 'MEM0_API_KEY',
          });
          return null;
        }
        logger.info('Creating Mem0HostedProvider with API key', {
          apiKeyLength: apiKey.length,
          apiKeyPrefix: apiKey.substring(0, 8) + '...',
        });
        return new Mem0HostedProvider(apiKey);
      }

      case 'upstash': {
        const url = process.env.UPSTASH_VECTOR_REST_URL;
        const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
        if (!url || !token) {
          logger.warn('Upstash Vector credentials not set, memory features will be disabled');
          return null;
        }
        // 注意：Upstash 需要 embedding provider（未來實作）
        return new UpstashProvider(url, token, undefined);
      }

      case 'postgresql': {
        // 注意：PostgreSQL 需要 embedding provider 和 pgvector（未來實作）
        return new PostgreSQLProvider(prisma, undefined);
      }

      case 'none':
      default: {
        logger.info('Memory provider disabled (type: none)');
        return null;
      }
    }
  }
}
