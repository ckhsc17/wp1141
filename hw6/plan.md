# Booboo Bot 架構重構與功能增強

## 架構說明

### tags
只留 tags，拿掉 SavedSourceType 和 SavedCategory
- **tags**：細分類標籤（例如：`insight`, `knowledge`, `memory`, `music`, `life` 等）

## 一、資料庫架構簡化（無需遷移）

### 1.1 直接刪除表格（資料不重要）

- **直接刪除表格**：`LineAccount`, `JournalEntry`, `Insight`, `LinkMetadata`, `Tag`, `ItemTag`
- **SavedItem 擴充**：
        - 新增 `tags String[]` 欄位（PostgreSQL array，儲存細分類標籤）
        - 新增 `metadata Json?` 欄位（儲存額外 metadata，如連結分析結果）
        - 新增 `location String?` 欄位（從 LinkMetadata 遷移，用於美食/娛樂地點）

### 1.2 更新 Prisma Schema

**檔案：`hw6/prisma/schema.prisma`**

- 移除 `LineAccount`, `JournalEntry`, `Insight`, `LinkMetadata`, `Tag`, `ItemTag` models
- 更新 `User` model：移除 `lineAccounts`, `journalEntries`, `insights` relations
- 更新 `SavedItem` model：
  ```prisma
  model SavedItem {
    // ... existing fields
    tags         String[]  @default([])  // 細分類標籤
    metadata     Json?                   // 額外 metadata
    location     String?                 // 地點（美食/娛樂用）
    sourceType   SavedSourceType         // 來源類型
    category     SavedCategory            // 內容分類
  }
  ```

## 二、Domain Schema 更新

### 2.1 更新 SavedItem Schema

**檔案：`hw6/src/domain/schemas.ts`**

- 更新 `SavedItemSchema`：新增 `tags`, `metadata`, `location`
- 移除 `JournalEntrySchema`, `InsightSchema`, `LinkAnalysisSchema`

### 2.2 更新 Intent Classification Schema

**檔案：`hw6/src/domain/schemas.ts`**

- 更新 `IntentClassificationSchema`：新增 `'insight'`, `'knowledge'`, `'memory'`，移除 `'journal'`

## 三、Repository 層更新

### 3.1 更新 SavedItemRepository

**檔案：`hw6/src/repositories/index.ts`**

- 新增方法：
        - `listByTags(userId: string, tags: string[], limit?: number): Promise<SavedItem[]>`
        - `searchByTags(userId: string, tags: string[], limit?: number): Promise<SavedItem[]>`（模糊匹配）
- 更新 `PrismaSavedItemRepository`：
        - 處理 `tags` array（Prisma `String[]` ↔ domain `string[]`）
        - 處理 `metadata` JSON
        - 實作 `searchByTags` 使用 PostgreSQL `@>` 或 `&&` 運算子

### 3.2 移除不需要的 Repository

- 移除 `JournalRepository`, `InsightRepository` interfaces 和實作
- 更新 `container.ts`：移除 `journalRepo`, `insightRepo`

## 四、Service 層重構

### 4.1 新增三個 Intent Service

**檔案：`hw6/src/services/insightService.ts`（重構）**

- `saveInsight(userId: string, text: string): Promise<SavedItem>`
- 使用 `analyzeInsight` prompt 分析內容
- 標記：`tag: 'insight'`, `sourceType: 'NOTE'`, `category: 'INSPIRATION'`

**檔案：`hw6/src/services/knowledgeService.ts`（新建）**

- `saveKnowledge(userId: string, text: string): Promise<SavedItem>`
- 使用 `analyzeKnowledge` prompt 分析內容
- 標記：`tag: 'knowledge'`, `sourceType: 'NOTE'`, `category: 'KNOWLEDGE'`

**檔案：`hw6/src/services/memoryService.ts`（新建）**

- `saveMemory(userId: string, text: string): Promise<SavedItem>`
- 使用 `analyzeMemory` prompt 分析內容
- 標記：`tag: 'memory'`, `sourceType: 'MEMORY'`, `category: 'INSPIRATION'`

### 4.2 改進 Recommendation Service

**檔案：`hw6/src/services/recommendationService.ts`**

- 新增 `extractTagsFromQuery`：使用 `extractRecommendationTags` prompt
- 改進 `generateRecommendation`：

        1. 提取 tags
        2. 使用 `savedItemRepo.searchByTags(userId, tags, 10)` 進行 RAG 查詢
        3. 使用 `generateRecommendationWithRAG` prompt 統整推薦

### 4.3 改進 Feedback Service

**檔案：`hw6/src/services/feedbackService.ts`**

- 新增 `extractFeedbackTags`：使用 `extractFeedbackTags` prompt
- 改進 `generateFeedback`：

        1. 提取 tags（生活、時間管理等）
        2. 使用 `savedItemRepo.searchByTags(userId, tags, 10)` 進行 RAG 查詢
        3. 使用 `generateFeedbackWithRAG` prompt 統整 feedback

- 移除 `journalRepo` 依賴

### 4.4 改進 Chat Service

**檔案：`hw6/src/services/chatService.ts`**

- 新增 `extractSearchKeywords`：使用 `extractSearchKeywords` prompt 產生 3 個關鍵字
- 改進 `searchHistory`：

        1. 提取 tags（如果查詢涉及特定主題）
        2. 產生 3 個搜尋關鍵字
        3. 混合查詢：`searchByTags` + `searchByText`
        4. 使用 `answerChatHistoryWithRAG` prompt 回答問題

### 4.5 更新 Link Service

**檔案：`hw6/src/services/linkService.ts`**

- 移除對 `LinkMetadata` 的依賴
- 將連結分析結果儲存在 `SavedItem.metadata` 和 `SavedItem.location`
- 更新 tags 儲存方式（直接存到 `SavedItem.tags` array）

## 五、Prompt Templates 更新（仔細構建）

### 5.1 更新 Intent Classification Prompt

**檔案：`hw6/src/services/promptManager.ts`**

- 更新 `classifyIntent` template，詳細定義三個新 intent：
  ```
  3. insight - 靈感（文學上、生活上的頓悟和啟發）
     - 範例：「今天突然理解了一個人生道理」「這本書給我的啟發是...」
  4. knowledge - 知識（資訊技術、學術、常識等）
     - 範例：「React Hooks 的用法」「量子力學的基本概念」
  5. memory - 記憶（個人經驗、日記、與某人的對話等，不屬於靈感或知識）
     - 範例：「今天跟朋友聊到...」「記得上次去...」
  6. music - 音樂（最近覺得好聽，想拿來練彈唱 / solo 的歌）
     - 範例：「在 solo」「陶喆 蝴蝶」「1. 館青 青少年觀察日記」「2. 方大同 love song」
  7. life - 展覽、電影、想從事的活動
     - 範例：「小巨蛋溜冰！」「左撇子女孩金馬獎」「人也太好了吧展」
  ```

- 移除 `journal` intent
- 明確區分規則和範例，確保 LLM 能準確分類

### 5.2 新增 Tag Extraction Prompts（仔細構建）

**檔案：`hw6/src/services/promptManager.ts`**

#### `extractRecommendationTags`

- **目的**：從 recommendation 查詢中提取相關 tags
- **輸出**：JSON `{ tags: string[] }`（3-5 個 tags）
- **規則**：提取具體主題或領域，如果查詢不明確返回通用 tags

#### `extractFeedbackTags`

- **目的**：從 feedback 查詢中提取相關 tags（生活、時間管理等）
- **輸出**：JSON `{ tags: string[] }`（2-4 個 tags）
- **規則**：識別主題領域（生活、時間管理、工作、學習、健康等）

#### `extractSearchKeywords`

- **目的**：從 chat_history 查詢中產生 3 個模糊搜尋關鍵字
- **輸出**：JSON `{ keywords: string[] }`（3 個關鍵字）
- **規則**：提取名詞、動詞或重要概念，排除停用詞

### 5.3 新增 Content Analysis Prompts（仔細構建）

**檔案：`hw6/src/services/promptManager.ts`**

#### `analyzeInsight`

- **目的**：分析「靈感」內容
- **輸出**：JSON `{ summary: string, tags: string[] }`
- **規則**：summary 150 字內，必須包含 `insight` tag，可選 `文學`, `生活`, `人生`, `啟發`

#### `analyzeKnowledge`

- **目的**：分析「知識」內容
- **輸出**：JSON `{ summary: string, tags: string[] }`
- **規則**：summary 150 字內，必須包含 `knowledge` tag，可選 `技術`, `學術`, `常識`, `資訊`

#### `analyzeMemory`

- **目的**：分析「記憶」內容
- **輸出**：JSON `{ summary: string, tags: string[] }`
- **規則**：summary 150 字內，必須包含 `memory` tag，可選 `日記`, `對話`, `經驗`, `回憶`

### 5.4 RAG Context 構建 Prompts（仔細構建）

**檔案：`hw6/src/services/promptManager.ts`**

#### `generateRecommendationWithRAG`

- **目的**：基於 RAG 查詢結果生成推薦
- **輸入**：用戶查詢、相關 SavedItems
- **輸出**：自然語言推薦文字
- **規則**：參考相關 SavedItems，提供具體可執行的推薦，語氣溫暖有行動力

#### `generateFeedbackWithRAG`

- **目的**：基於 RAG 查詢結果生成生活回饋
- **輸入**：用戶查詢、相關 SavedItems
- **輸出**：自然語言回饋文字
- **規則**：分析用戶生活模式，提供建設性建議，語氣溫暖支持性

#### `answerChatHistoryWithRAG`

- **目的**：基於 RAG 查詢結果回答 chat_history 問題
- **輸入**：用戶查詢、相關 SavedItems
- **輸出**：自然語言回答
- **規則**：直接回答問題，引用相關 SavedItems，找不到內容時誠實告知

## 六、Event Handler 更新

### 6.1 更新 Intent Routing

**檔案：`hw6/src/bot/eventHandler.ts`**

- 新增三個 intent cases：`insight`, `knowledge`, `memory`
- 移除 `journal` case
- 更新 `recommendation`, `feedback`, `chat_history` cases 使用新的 RAG 邏輯

### 6.2 更新 Message Functions

**檔案：`hw6/src/bot/messages.ts`**

- 新增 `sendInsightMessage`, `sendKnowledgeMessage`, `sendMemoryMessage`
- 更新現有 message functions 支援 tags 顯示

## 七、Container 更新

### 7.1 更新 Service 註冊

**檔案：`hw6/src/container.ts`**

- 移除 `journalService`, `insightService`（舊版）
- 新增 `insightService`（新版）, `knowledgeService`, `memoryService`
- 更新 `feedbackService` 依賴（移除 `journalRepo`）

## 八、文檔整理

### 8.1 應用情境與範例對話

**檔案：`hw6/USAGE_GUIDE.md`（新建）**

- 整理所有 intent 的應用情境
- 提供範例對話（每個 intent 3-5 個範例）
- 說明 tags 使用方式和 RAG 運作原理

### 8.2 架構說明

**檔案：`hw6/ARCHITECTURE.md`（新建）**

- 說明簡化後的資料庫架構
- 說明 tags 的意義
- 說明 RAG 查詢流程

### 8.3 未來規劃

**檔案：`hw6/FUTURE_PLANS.md`（新建）**

- 向量比對實作規劃（pgvector vs Supabase Vector）
- 更進階的 tag 自動分類
- 個人化推薦演算法

## 九、程式碼架構確保乾淨

### 9.1 架構原則

- **單一職責**：每個 service 只負責一個 intent 或功能
- **依賴注入**：所有 service 透過 constructor 注入 dependencies
- **錯誤處理**：所有 LLM 調用都有 try-catch 和 fallback
- **型別安全**：使用 Zod schema 驗證所有輸入輸出
- **日誌完善**：關鍵操作都記錄 debug/info/error logs

### 9.2 程式碼組織

- **Service 層**：每個 intent 有獨立的 service
- **Repository 層**：統一的 `SavedItemRepository` interface
- **Prompt 層**：所有 prompts 集中在 `promptManager.ts`
- **Handler 層**：`eventHandler.ts` 只負責路由，不包含業務邏輯

## 實作順序

1. **資料庫 Schema**：更新 Prisma schema（直接刪除表格）→ `prisma generate`
2. **Domain & Repository**：更新 schemas 和 repository interfaces
3. **Prompt Templates**：仔細構建所有 prompts
4. **Service 層**：實作新的三個 intent services 和改進的 RAG 邏輯
5. **Event Handler**：更新路由邏輯
6. **測試與文檔**：測試所有功能並整理文檔

## 注意事項

- **無需資料遷移**：直接刪除舊表格，資料不重要
- **Prompt 品質**：仔細構建每個 prompt，確保 LLM 輸出格式一致
- **架構乾淨**：保持 service/repository/handler 層級清晰
- **所有 LLM 調用都需有 fallback 機制**
- **RAG 查詢結果需限制數量**：避免 token 超限（建議 10-15 筆）
- **確保 tags 的格式一致性**：統一為英文小寫