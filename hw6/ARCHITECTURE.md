# Booboo Bot 架構說明

## 資料庫架構

### 簡化後的設計

所有內容統一儲存在 `SavedItem` 表格中，使用 `tags` 進行分類：

```prisma
model SavedItem {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  title       String?
  content     String
  rawText     String?
  url         String?
  sentiment   Sentiment? @default(NEUTRAL)

  tags        String[] @default([])  // 細分類標籤
  metadata    Json?                   // 額外 metadata
  location    String?                 // 地點（美食/娛樂用）

  todos       Todo[]
}
```

### Tags 的意義

**Tags** 是細分類標籤，統一使用英文小寫，例如：
- `insight`: 靈感相關
- `knowledge`: 知識相關
- `memory`: 記憶相關
- `music`: 音樂相關
- `life`: 生活活動相關
- `link`: 連結相關
- 其他自訂標籤（例如：`technology`, `react`, `time-management` 等）

所有內容都透過 tags 進行分類和搜尋，不再使用 `sourceType` 和 `category`。

## 系統架構

### 分層架構

```
┌─────────────────┐
│  Event Handler  │  ← LINE Webhook 入口
└────────┬────────┘
         │
┌────────▼────────┐
│   Services      │  ← 業務邏輯層
│  - Intent       │
│  - Todo         │
│  - Insight      │
│  - Knowledge    │
│  - Memory       │
│  - Music        │
│  - Life         │
│  - Link         │
│  - Feedback     │
│  - Recommendation│
│  - Chat         │
└────────┬────────┘
         │
┌────────▼────────┐
│  Repositories   │  ← 資料存取層
│  - SavedItem    │
│  - Todo         │
│  - Reminder     │
│  - User         │
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │  ← PostgreSQL (Prisma)
└─────────────────┘
```

### Service 層職責

每個 Service 負責單一功能：

- **IntentClassificationService**: 意圖分類
- **TodoService**: 待辦事項管理
- **InsightService**: 靈感儲存與分析
- **KnowledgeService**: 知識儲存與分析
- **MemoryService**: 記憶儲存與分析
- **MusicService**: 音樂儲存與分析
- **LifeService**: 生活活動儲存與分析
- **LinkService**: 連結分析與儲存
- **FeedbackService**: 生活回饋生成（使用 RAG）
- **RecommendationService**: 推薦生成（使用 RAG）
- **ChatService**: 對話與對話紀錄查詢（使用 RAG）

## RAG 查詢流程

### Recommendation Service

```
用戶查詢
  ↓
提取 Tags (extractRecommendationTags)
  ↓
搜尋相關內容 (searchByTags)
  ↓
生成推薦 (generateRecommendationWithRAG)
  ↓
回覆用戶
```

### Feedback Service

```
用戶查詢
  ↓
提取 Tags (extractFeedbackTags)
  ↓
搜尋相關內容 (searchByTags)
  ↓
生成回饋 (generateFeedbackWithRAG)
  ↓
回覆用戶
```

### Chat History Service

```
用戶查詢
  ↓
提取 Tags + 產生關鍵字 (extractSearchKeywords)
  ↓
混合查詢 (searchByTags + searchByText)
  ↓
回答問題 (answerChatHistoryWithRAG)
  ↓
回覆用戶
```

## 意圖分類流程

```
用戶訊息
  ↓
Intent Classification (LLM)
  ↓
路由到對應 Service
  ↓
處理並回覆
```

### 支援的 Intent

1. **todo**: 待辦事項（create/update/query）
2. **link**: 資訊連結
3. **insight**: 靈感
4. **knowledge**: 知識
5. **memory**: 記憶
6. **music**: 音樂
7. **life**: 生活活動
8. **feedback**: 回饋請求
9. **recommendation**: 推薦請求
10. **chat_history**: 對話紀錄查詢
11. **other**: 一般聊天

## 資料流程

### 儲存內容流程

```
用戶輸入
  ↓
Intent Classification
  ↓
對應 Service 分析內容 (LLM)
  ↓
提取 Tags 和摘要
  ↓
儲存到 SavedItem
  ↓
回覆用戶
```

### 查詢內容流程

```
用戶查詢
  ↓
提取 Tags/關鍵字 (LLM)
  ↓
Repository 查詢 (searchByTags/searchByText)
  ↓
RAG Context 構建
  ↓
LLM 生成回應
  ↓
回覆用戶
```

## 技術棧

- **Runtime**: Node.js (Vercel)
- **Framework**: Next.js (App Router)
- **Bot Framework**: Bottender
- **Database**: PostgreSQL (Prisma ORM)
- **AI**: Google Gemini API
- **Validation**: Zod
- **Logging**: Winston (structured logging)

## 錯誤處理

所有 LLM 調用都有 fallback 機制：
- 如果 LLM 解析失敗，使用簡單的關鍵字匹配
- 如果 LLM 服務不可用，返回預設回應
- 所有錯誤都會記錄到日誌中

## 日誌

關鍵操作都會記錄：
- Intent 分類結果
- RAG 查詢的 tags 和結果數量
- LLM 回應預覽
- 錯誤詳情

