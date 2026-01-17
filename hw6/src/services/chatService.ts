import type { SavedItemRepository } from '@/repositories';
import { SavedItemSchema, type SavedItem } from '@/domain/schemas';
import { GeminiService } from './geminiService';
import type { IMemoryProvider } from './memory/IMemoryProvider';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class ChatService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
    private readonly memoryProvider: IMemoryProvider | null, // 使用抽象介面，可能為 null
  ) {}

  private async extractSearchKeywords(query: string): Promise<string[]> {
    const response = await this.gemini.generate({
      template: 'extractSearchKeywords',
      payload: { query },
    });

    let keywords: string[] = [];

    try {
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as { keywords: string[] | null };
      const cleaned = nullToUndefined(parsed);
      keywords = cleaned.keywords || [];
    } catch (error) {
      logger.warn('Failed to parse search keywords, using fallback', {
        query,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback: use query as keyword
      keywords = [query];
    }

    return keywords;
  }

  async searchHistory(userId: string, query: string): Promise<string> {
    // 1. 使用記憶 Provider 的智能搜尋（如果有）
    // 查詢對話歷史時，不限制 categories，允許搜尋所有類型記憶
    let memories = '';
    if (this.memoryProvider) {
      memories = await this.memoryProvider.searchRelevantMemories(
        userId,
        query,
        10,
        undefined // 不限制 categories
      );
    }
    
    // 2. 如果沒有記憶 Provider 或沒有結果，fallback 到原有邏輯
    if (!memories) {
      // Extract tags and keywords
      const keywords = await this.extractSearchKeywords(query);
      
      // Try to extract tags if query involves specific topics
      const lowerQuery = query.toLowerCase();
      const potentialTags: string[] = [];
      if (lowerQuery.includes('生活') || lowerQuery.includes('life')) potentialTags.push('life');
      if (lowerQuery.includes('知識') || lowerQuery.includes('knowledge')) potentialTags.push('knowledge');
      if (lowerQuery.includes('靈感') || lowerQuery.includes('insight')) potentialTags.push('insight');
      if (lowerQuery.includes('記憶') || lowerQuery.includes('memory')) potentialTags.push('memory');
      if (lowerQuery.includes('音樂') || lowerQuery.includes('music')) potentialTags.push('music');

      // Mixed query: search by tags and keywords
      const tagResults = potentialTags.length > 0
        ? await this.savedItemRepo.searchByTags(userId, potentialTags, 5)
        : [];
      
      const textResults = await Promise.all(
        keywords.map((keyword) => this.savedItemRepo.searchByText(userId, keyword, 3))
      );
      const textResultsFlat = Array.from(new Set(textResults.flat().map((item) => item.id)))
        .map((id) => textResults.flat().find((item) => item.id === id)!)
        .slice(0, 5);

      // Combine and deduplicate results
      const allResults = [...tagResults, ...textResultsFlat];
      const uniqueResults = Array.from(
        new Map(allResults.map((item) => [item.id, item])).values()
      ).slice(0, 10);

      if (uniqueResults.length === 0) {
        return '我找不到相關的對話紀錄呢 😅 試試看用不同的關鍵字搜尋？';
      }

      // Format items for RAG context
      const itemsText = uniqueResults
        .map((item, idx) => `${idx + 1}. ${item.title || item.content}${item.url ? ` (${item.url})` : ''}${item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : ''}`)
        .join('\n');

      const response = await this.gemini.generate({
        template: 'answerChatHistoryWithRAG',
        payload: { query, items: itemsText },
      });

      logger.debug('Chat history searched with fallback logic', {
        userId,
        query,
        keywords,
        potentialTags,
        resultsCount: uniqueResults.length,
        responsePreview: response.slice(0, 200),
      });

      return response.trim();
    }
    
    // 3. 使用記憶 Provider 的結果生成回應
    const response = await this.gemini.generate({
      template: 'answerChatHistoryWithRAG',
      payload: { 
        query, 
        items: memories.replace('相關背景記憶：\n', '')
      },
    });

    logger.debug('Chat history searched with memory provider', {
      userId,
      query,
      hasMemories: !!memories,
      responsePreview: response.slice(0, 200),
    });
    
    return response.trim();
  }

  async chat(userId: string, text: string): Promise<string> {
    // 1. 使用記憶 Provider 搜尋相關記憶（如果有）
    // 注意：閒聊時不限制 categories，讓所有記憶都可以被搜尋到
    let relevantMemories = '';
    if (this.memoryProvider) {
      relevantMemories = await this.memoryProvider.searchRelevantMemories(
        userId,
        text,
        5,
        undefined // 不限制 categories，允許搜尋所有類型記憶
      );
    }
    
    // 2. 如果沒有記憶 Provider，fallback 到原有邏輯（最近 3 條記錄）
    let context: string | undefined = relevantMemories || undefined;
    if (!context) {
      const recentItems = await this.savedItemRepo.listByUser(userId, 3);
      context = recentItems.length > 0
        ? `最近記錄：${recentItems.map((i) => i.title || i.content).join('、')}`
        : undefined;
    }
    
    // 3. 生成回應（帶上記憶 context）
    const response = await this.gemini.generate({
      template: 'chat',
      payload: { text, context },
    });

    logger.debug('Chat response generated', {
      userId,
      hasMemoryContext: !!relevantMemories,
      textPreview: text.slice(0, 100),
      responsePreview: response.slice(0, 200),
    });

    return response.trim();
  }

  /**
   * 針對不同意圖類型提取並儲存記憶
   */
  private async extractAndSaveMemoryByIntent(
    userId: string,
    intent: string,
    userMessage: string,
    assistantResponse?: string,
    extraData?: Record<string, unknown>
  ): Promise<void> {
    if (!this.memoryProvider) {
      logger.debug('Memory provider not available, skipping memory extraction');
      return;
    }

    let memoryText: string | null = null;
    let templateName: string;

    try {
      switch (intent) {
        case 'todo': {
          templateName = 'extractTodoMemory';
          const response = await this.gemini.generate({
            template: templateName as any,
            payload: {
              text: userMessage,
              subIntent: extraData?.subIntent || '',
            },
          });

          const jsonStr = extractJsonString(response);
          const parsed = JSON.parse(jsonStr) as { memory: string | null; keywords?: string[] };
          memoryText = parsed.memory || null;
          break;
        }

        case 'link': {
          templateName = 'extractLinkMemory';
          const response = await this.gemini.generate({
            template: templateName as any,
            payload: {
              text: userMessage,
              linkTitle: extraData?.linkTitle || '',
              linkType: extraData?.linkType || '',
            },
          });

          const jsonStr = extractJsonString(response);
          const parsed = JSON.parse(jsonStr) as { memory: string | null; keywords?: string[] };
          memoryText = parsed.memory || null;
          break;
        }

        case 'save_content': {
          templateName = 'extractSaveContentMemory';
          const response = await this.gemini.generate({
            template: templateName as any,
            payload: {
              text: userMessage,
              contentType: extraData?.contentType || '',
            },
          });

          const jsonStr = extractJsonString(response);
          const parsed = JSON.parse(jsonStr) as { memory: string | null; keywords?: string[] };
          memoryText = parsed.memory || null;
          break;
        }

        case 'query': {
          templateName = 'extractQueryMemory';
          const response = await this.gemini.generate({
            template: templateName as any,
            payload: {
              text: userMessage,
              queryType: extraData?.queryType || '',
            },
          });

          const jsonStr = extractJsonString(response);
          const parsed = JSON.parse(jsonStr) as { memory: string | null; keywords?: string[] };
          memoryText = parsed.memory || null; // query 可能為 null（沒有新資訊）
          break;
        }

        case 'other': {
          templateName = 'extractOtherMemory';
          const response = await this.gemini.generate({
            template: templateName as any,
            payload: { text: userMessage },
          });

          const jsonStr = extractJsonString(response);
          const parsed = JSON.parse(jsonStr) as { memory: string | null; keywords?: string[] };
          memoryText = parsed.memory || null;
          break;
        }

        default: {
          logger.debug('Intent type not supported for memory extraction', { intent });
          return;
        }
      }

      // 如果提取到記憶，儲存到 memory provider
      if (memoryText) {
        // 將提取的記憶格式化為對話格式
        // 注意：Mem0 的 addConversation 只接受 user 和 assistant 角色
        // 我們將提取的記憶作為 assistant 消息的一部分
        const memoryMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
          { role: 'user', content: userMessage },
        ];

        // 如果有 assistant 響應，加入；然後將提取的記憶作為第二個 assistant 消息
        if (assistantResponse) {
          memoryMessages.push({ role: 'assistant', content: assistantResponse });
        }
        
        // 將提取的記憶作為額外的 assistant 消息（表示系統提取的記憶）
        memoryMessages.push({ role: 'assistant', content: `[Extracted Memory] ${memoryText}` });

        // 傳入 intent 作為 category，確保記憶分類正確
        this.memoryProvider.addConversation(userId, memoryMessages, intent).catch((error) => {
          logger.error('Memory provider add conversation failed (non-blocking)', {
            userId,
            intent,
            memoryPreview: memoryText ? memoryText.slice(0, 50) : 'null',
            error: error instanceof Error ? error.message : String(error),
          });
        });

        logger.info('Memory extracted and saved', {
          userId,
          intent,
          memoryPreview: memoryText ? memoryText.slice(0, 50) : 'null',
        });
      } else {
        logger.debug('No memory extracted from intent', { userId, intent });
      }
    } catch (error) {
      logger.warn('Failed to extract memory from intent', {
        userId,
        intent,
        error: error instanceof Error ? error.message : String(error),
      });
      // 不拋出錯誤，避免影響主流程
    }
  }

  /**
   * 儲存對話到記憶 Provider（通用方法，可被所有意圖類型使用）
   * @param userId 用戶 ID
   * @param userMessage 用戶訊息
   * @param assistantResponse 助手回應
   * @param category 可選：記憶類別（例如：'todo', 'link', 'save_content', 'query', 'other'）
   */
  async saveConversationToMemory(
    userId: string,
    userMessage: string,
    assistantResponse: string,
    category?: string
  ): Promise<void> {
    if (!this.memoryProvider) {
      logger.debug('Memory provider not available, skipping conversation save');
      return;
    }

    logger.info('Saving conversation to memory provider', {
      userId,
      category: category || 'none',
      userMessagePreview: userMessage.slice(0, 50),
      assistantResponsePreview: assistantResponse.slice(0, 50),
    });

    this.memoryProvider.addConversation(userId, [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse },
    ], category).catch((error) => {
      logger.error('Memory provider add conversation failed (non-blocking)', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    });
  }

  /**
   * 為不同意圖類型提取並儲存記憶（公開方法）
   */
  async extractMemoryForIntent(
    userId: string,
    intent: string,
    userMessage: string,
    assistantResponse?: string,
    extraData?: Record<string, unknown>
  ): Promise<void> {
    await this.extractAndSaveMemoryByIntent(userId, intent, userMessage, assistantResponse, extraData);
  }

  async saveChat(userId: string, text: string, assistantResponse?: string): Promise<SavedItem> {
    // 1. 記憶 Provider 自動提取並儲存重要記憶（非同步，不阻塞）
    if (assistantResponse) {
      await this.saveConversationToMemory(userId, text, assistantResponse);
    } else {
      logger.debug('Skipping memory provider add conversation (no assistant response)', {
        userId,
        hasProvider: !!this.memoryProvider,
      });
    }

    // 2. 保持向後相容：仍儲存到 SavedItem（快速響應）
    // Use LLM to analyze chat content
    const response = await this.gemini.generate({
      template: 'analyzeChat',
      payload: { text },
    });

    let summary = text.slice(0, 150);
    let tags: string[] = ['chat'];

    try {
      const jsonStr = extractJsonString(response);
      const parsed = JSON.parse(jsonStr) as { summary: string | null; tags: string[] | null };
      const cleaned = nullToUndefined(parsed);
      summary = cleaned.summary || summary;
      tags = cleaned.tags || tags;
    } catch (error) {
      logger.warn('Failed to parse chat analysis, using fallback', {
        userId,
        textPreview: text.slice(0, 100),
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Ensure tags are lowercase
    tags = tags.map((tag) => tag.toLowerCase());

    const item = await this.savedItemRepo.create({
      userId,
      title: summary.slice(0, 40),
      content: text,
      tags,
    });

    logger.info('Chat saved', { userId, itemId: item.id, tags, hasMemoryProvider: !!this.memoryProvider });

    return SavedItemSchema.parse(item);
  }
}

