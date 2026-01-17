/**
 * 記憶儲存與檢索的抽象介面
 * 支援多種實作（Mem0 hosted、Upstash Vector、PostgreSQL）
 */
export interface IMemoryProvider {
  /**
   * 搜尋相關記憶
   * @param userId 用戶 ID
   * @param query 搜尋查詢
   * @param limit 結果數量限制
   * @param categories 可選：過濾特定類別（例如：['todo'] 只搜尋待辦相關記憶）
   * @returns 格式化的記憶文字（用於 LLM context）
   */
  searchRelevantMemories(
    userId: string,
    query: string,
    limit?: number,
    categories?: string[]
  ): Promise<string>;

  /**
   * 記錄對話並自動提取記憶
   * @param userId 用戶 ID
   * @param messages 對話訊息（user + assistant）
   * @param category 可選：記憶類別（例如：'todo', 'link', 'save_content', 'query', 'other'）
   * @returns Promise<void>
   */
  addConversation(
    userId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    category?: string
  ): Promise<void>;

  /**
   * 清理資源（如果需要）
   */
  dispose?(): Promise<void>;
}
