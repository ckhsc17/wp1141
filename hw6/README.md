# Booboo 小幽 - LINE 智慧助理

## 專案簡介

**Booboo 小幽** 是一個幫你把生活中的連結、靈感、提醒與情緒整理成「可行動智慧」的 LINE 助理。把任何訊息丟給小幽，它會透過 Gemini API 分析內容、分類並存入個人資料庫，必要時主動提醒或給出洞察 - 簡單來說，就是一個有著智慧的「me 群組」。

- **小幽 Booboo 好友 QR code**：https://lin.ee/HT9b2xR
- **Admin Dashboard**：https://boobooboo.vercel.app/admin

## 技術架構

- **框架**：Next.js 14 (App Router) + TypeScript
- **部署**：Vercel Serverless Functions
- **資料庫**：PostgreSQL (Prisma ORM)
- **AI 服務**：Google Gemini API
- **訊息平台**：LINE Messaging API (`messaging-api-line`)
- **記憶引擎**：Mem0 (長期記憶管理)
- **架構模式**：Service Layer + Repository Pattern

---

## 系統架構演進

### 導入 Mem0 前的架構（v1.0）

在導入 Mem0 之前，系統主要依賴 PostgreSQL 的 `SavedItem` 表來儲存對話記錄，並使用 tag 和全文搜尋來檢索相關內容。

```mermaid
graph TB
    subgraph "外部服務"
        LINE[LINE Platform]
        GEMINI[Google Gemini API]
    end

    subgraph "Next.js Application"
        WEBHOOK[POST /api/line<br/>Webhook Handler]
        EH[eventHandler.ts<br/>事件處理器]
    end

    subgraph "Service Layer"
        CHAT[chatService<br/>對話處理]
        FEEDBACK[feedbackService<br/>回饋生成]
        REC[recommendationService<br/>推薦生成]
    end

    subgraph "Repository Layer"
        SR[SavedItemRepository<br/>查詢最近 3 條記錄]
    end

    subgraph "Database"
        PG[(PostgreSQL<br/>SavedItem 表<br/>tag 搜尋 + 全文搜尋)]
    end

    LINE -->|Webhook Events| WEBHOOK
    WEBHOOK --> EH
    EH -->|路由| CHAT
    EH -->|路由| FEEDBACK
    EH -->|路由| REC
    
    CHAT -->|搜尋| SR
    FEEDBACK -->|搜尋 SavedItem<br/>by tags| SR
    REC -->|搜尋 SavedItem<br/>by tags + text| SR
    
    SR -->|讀取| PG
    
    CHAT -->|生成回應| GEMINI
    FEEDBACK -->|RAG 生成| GEMINI
    REC -->|RAG 生成| GEMINI
    
    style GEMINI fill:#4285F4,color:#fff
    style LINE fill:#00C300,color:#fff
    style PG fill:#336791,color:#fff
```

**限制**：
- ❌ 只能查詢最近 N 條記錄，無法做語意搜尋
- ❌ 依賴硬編碼的 tag 提取，缺乏個人化
- ❌ 無法提取和儲存「習慣」、「偏好」等高階抽象記憶
- ❌ 長期對話脈絡容易遺失

### 導入 Mem0 後的架構（v2.0）

導入 Mem0 後，系統增加了長期記憶管理能力，能夠提取、儲存和檢索用戶的習慣、偏好、興趣等高階抽象記憶。

```mermaid
graph TB
    subgraph "外部服務"
        LINE[LINE Platform]
        GEMINI[Google Gemini API]
        MEM0[Mem0 Hosted API<br/>記憶引擎]
    end

    subgraph "Next.js Application"
        WEBHOOK[POST /api/line<br/>Webhook Handler]
        EH[eventHandler.ts<br/>事件處理器]
    end

    subgraph "Service Layer"
        CHAT[chatService<br/>對話處理]
        FEEDBACK[feedbackService<br/>回饋生成]
        REC[recommendationService<br/>推薦生成]
    end

    subgraph "Memory Layer"
        MP[MemoryProvider<br/>抽象介面]
        MFP[MemoryProviderFactory<br/>工廠模式]
        MEM0P[Mem0HostedProvider<br/>Mem0 實作]
        UP[UpstashProvider<br/>Upstash 實作<br/>預留]
        PG[PostgreSQLProvider<br/>PostgreSQL 實作<br/>預留]
    end

    subgraph "Repository Layer"
        SR[SavedItemRepository<br/>儲存原始記錄]
    end

    subgraph "Database"
        PGDB[(PostgreSQL<br/>SavedItem 表<br/>原始對話記錄)]
        MEM0DB[(Mem0 Cloud<br/>長期記憶儲存<br/>習慣/偏好/興趣)]
    end

    LINE -->|Webhook Events| WEBHOOK
    WEBHOOK --> EH
    EH -->|路由| CHAT
    EH -->|路由| FEEDBACK
    EH -->|路由| REC
    
    CHAT -->|語意搜尋記憶| MP
    FEEDBACK -->|語意搜尋記憶| MP
    REC -->|語意搜尋記憶| MP
    
    CHAT -->|提取記憶<br/>按意圖類型| GEMINI
    CHAT -->|儲存原始對話| SR
    
    MFP -->|創建| MEM0P
    MP -.實作.-> MEM0P
    MP -.實作預留.-> UP
    MP -.實作預留.-> PG
    
    MEM0P -->|搜尋/儲存| MEM0
    MEM0 -->|讀寫| MEM0DB
    
    SR -->|讀寫| PGDB
    
    CHAT -->|生成回應| GEMINI
    FEEDBACK -->|RAG 生成<br/>結合 SavedItem + Mem0| GEMINI
    REC -->|RAG 生成<br/>結合 SavedItem + Mem0| GEMINI
    
    style GEMINI fill:#4285F4,color:#fff
    style LINE fill:#00C300,color:#fff
    style MEM0 fill:#FF6B6B,color:#fff
    style PGDB fill:#336791,color:#fff
    style MEM0DB fill:#FF6B6B,color:#fff
```

**改進**：
- ✅ 語意搜尋：能夠根據查詢的語意找到相關記憶，而不只是關鍵字匹配
- ✅ 個人化記憶提取：針對不同意圖提取不同類型的記憶（習慣、偏好、興趣等）
- ✅ 長期脈絡：能夠記住用戶的長期偏好和習慣
- ✅ 抽象層設計：可以輕鬆切換不同的記憶後端（Mem0、Upstash、PostgreSQL）

---

## Mem0 vs. 單純 Vector Cosine Similarity

### 為什麼選擇 Mem0？

Mem0 不僅僅是 vector similarity search，它是一個**完整的記憶管理系統**，包含以下特性：

| 特性 | Mem0 | 單純 Vector Cosine Similarity |
|------|------|------------------------------|
| **記憶提取** | ✅ LLM 驅動的結構化提取<br/>（例如：「用戶習慣在週六買牛奶」） | ❌ 需要手動設計 prompt |
| **記憶類型** | ✅ 支援多種記憶類型<br/>（習慣、偏好、興趣、事實） | ❌ 只是相似度搜尋 |
| **記憶合併** | ✅ 自動檢測和合併重複記憶 | ❌ 需要手動去重 |
| **分類管理** | ✅ 支援 categories 分類<br/>（todo、link、save_content 等） | ❌ 需要手動標籤 |
| **時間過濾** | ✅ 支援日期範圍搜尋<br/>（「我 1/17 在幹嘛？」） | ❌ 需要額外 metadata |
| **重要性評分** | ✅ 自動評分記憶重要性 | ❌ 需要手動設計 |
| **記憶聚合** | ✅ 自動聚合相關記憶 | ❌ 需要手動處理 |

### 實際應用場景

**場景 1：推薦系統**
```
用戶：「推薦一些音樂」
```

**使用 Vector Similarity**：
- 搜尋相似關鍵字：「音樂」、「solo」、「歌曲」
- 只能找到包含這些詞的記錄
- 無法理解「用戶喜歡爵士樂」這種抽象偏好

**使用 Mem0**：
- 語意搜尋找到「用戶喜歡爵士樂」、「用戶對 React 技術感興趣」等高階記憶
- 即使沒有直接相關的 SavedItem，也能基於偏好生成推薦

**場景 2：個人化回饋**
```
用戶：「我的時間管理如何？」
```

**使用 Vector Similarity**：
- 只能搜尋 tag 包含「todo」、「memory」的記錄
- 無法提取「用戶常有延遲執行的傾向」這種習慣

**使用 Mem0**：
- 提取「用戶習慣在週六買牛奶」（todo 習慣）
- 提取「用戶對 React 技術感興趣」（link 興趣）
- 基於這些提取的偏好和習慣，生成個人化回饋

---

## 完整系統架構圖（導入 Mem0 後）

```mermaid
graph TB
    subgraph "外部服務"
        LINE[LINE Platform]
        GEMINI[Google Gemini API]
        MEM0[Mem0 Hosted API<br/>記憶引擎]
        VERCEL[Vercel Cron Jobs]
    end

    subgraph "Next.js Application"
        WEBHOOK[POST /api/line<br/>Webhook Handler]
        CRON[GET /api/cron/check-todo-notifications<br/>每小時執行]
        ADMIN[Admin Dashboard<br/>/admin/*]
        DEBUG[GET /api/debug<br/>健康檢查]
    end

    subgraph "Bot Layer"
        EH[eventHandler.ts<br/>事件處理器]
        WH[webhookHandler.ts<br/>Webhook 路由]
        MSG[messages.ts<br/>訊息模板]
    end

    subgraph "Service Layer"
        IC[intentClassificationService<br/>意圖分類]
        TODO[todoService<br/>待辦管理]
        CHAT[chatService<br/>對話處理<br/>+ 記憶提取]
        LINK[linkService<br/>連結分析]
        INSIGHT[insightService<br/>靈感儲存]
        KNOWLEDGE[knowledgeService<br/>知識儲存]
        MEMORY[memoryService<br/>記憶儲存]
        MUSIC[musicService<br/>音樂儲存]
        LIFE[lifeService<br/>活動儲存]
        FEEDBACK[feedbackService<br/>回饋生成<br/>+ Mem0 RAG]
        REC[recommendationService<br/>推薦生成<br/>+ Mem0 RAG]
        REM[reminderService<br/>提醒管理]
    end

    subgraph "Memory Layer"
        MP[IMemoryProvider<br/>抽象介面]
        MFP[MemoryProviderFactory]
        MEM0P[Mem0HostedProvider]
    end

    subgraph "Repository Layer"
        UR[UserRepository]
        SR[SavedItemRepository]
        TR[TodoRepository]
        RR[ReminderRepository]
    end

    subgraph "Database"
        PG[(PostgreSQL<br/>Prisma<br/>原始記錄)]
        MEM0DB[(Mem0 Cloud<br/>長期記憶)]
    end

    subgraph "Utils"
        ML[messageLimit.ts<br/>訊息限制]
        LOG[logger.ts<br/>日誌系統]
        PM[promptManager.ts<br/>Prompt 管理]
    end

    LINE -->|Webhook Events| WEBHOOK
    WEBHOOK --> WH
    WH --> EH
    EH -->|意圖分類| IC
    IC -->|呼叫| GEMINI
    
    EH -->|路由到服務| TODO
    EH -->|路由到服務| CHAT
    EH -->|路由到服務| LINK
    EH -->|路由到服務| INSIGHT
    EH -->|路由到服務| KNOWLEDGE
    EH -->|路由到服務| MEMORY
    EH -->|路由到服務| MUSIC
    EH -->|路由到服務| LIFE
    EH -->|路由到服務| FEEDBACK
    EH -->|路由到服務| REC
    
    CHAT -->|語意搜尋記憶| MP
    CHAT -->|提取記憶<br/>按意圖| GEMINI
    FEEDBACK -->|語意搜尋記憶| MP
    REC -->|語意搜尋記憶| MP
    
    MFP -->|創建| MEM0P
    MP -.實作.-> MEM0P
    MEM0P -->|搜尋/儲存| MEM0
    MEM0 -->|讀寫| MEM0DB
    
    TODO -->|呼叫| GEMINI
    CHAT -->|呼叫| GEMINI
    LINK -->|呼叫| GEMINI
    INSIGHT -->|呼叫| GEMINI
    KNOWLEDGE -->|呼叫| GEMINI
    MEMORY -->|呼叫| GEMINI
    MUSIC -->|呼叫| GEMINI
    LIFE -->|呼叫| GEMINI
    FEEDBACK -->|呼叫| GEMINI
    REC -->|呼叫| GEMINI
    
    TODO --> TR
    TODO --> RR
    CHAT --> SR
    LINK --> SR
    INSIGHT --> SR
    KNOWLEDGE --> SR
    MEMORY --> SR
    MUSIC --> SR
    LIFE --> SR
    FEEDBACK --> SR
    REC --> SR
    
    TR --> PG
    RR --> PG
    SR --> PG
    UR --> PG
    
    VERCEL -->|每小時| CRON
    CRON --> RR
    CRON --> TR
    CRON -->|發送通知| LINE
    
    EH -->|檢查限制| ML
    ML --> SR
    
    IC --> PM
    TODO --> PM
    CHAT --> PM
    LINK --> PM
    INSIGHT --> PM
    KNOWLEDGE --> PM
    MEMORY --> PM
    MUSIC --> PM
    LIFE --> PM
    FEEDBACK --> PM
    REC --> PM
    
    EH -->|發送訊息| MSG
    MSG -->|Push Message| LINE
    
    style GEMINI fill:#4285F4,color:#fff
    style LINE fill:#00C300,color:#fff
    style MEM0 fill:#FF6B6B,color:#fff
    style PG fill:#336791,color:#fff
    style MEM0DB fill:#FF6B6B,color:#fff
    style VERCEL fill:#000,color:#fff
```

---

## 完整使用流程

### 1. 用戶發送訊息流程

```
用戶發送訊息
    ↓
LINE Platform 發送 Webhook 到 /api/line
    ↓
webhookHandler.ts 驗證簽名並解析事件
    ↓
eventHandler.ts 處理事件
    ↓
[檢查] 是否為內建功能（使用教學、查看幽靈幣）→ 直接回應
    ↓
[檢查] 每日訊息限制（8次 API 呼叫）
    ↓
intentClassificationService.classify()
    ├─→ 呼叫 Gemini API (classifyIntent)
    └─→ 返回：{ intent, subIntent, confidence }
    ↓
根據 intent 路由到對應服務：
    ├─ todo → todoService
    │   ├─ create → createTodos() → 呼叫 Gemini (extractMultipleTodos, extractTodoDateTime)
    │   ├─ update → updateTodoByNaturalLanguage() → 呼叫 Gemini (matchTodoForUpdate)
    │   └─ query → queryTodosByNaturalLanguage() → 呼叫 Gemini (parseTodoQuery)
    │
    ├─ link → linkService.analyzeAndSave() → 呼叫 Gemini (analyzeLink)
    │
    ├─ insight → insightService.saveInsight() → 呼叫 Gemini (analyzeInsight)
    │
    ├─ knowledge → knowledgeService.saveKnowledge() → 呼叫 Gemini (analyzeKnowledge)
    │
    ├─ memory → memoryService.saveMemory() → 呼叫 Gemini (analyzeMemory)
    │
    ├─ music → musicService.saveMusic() → 呼叫 Gemini (analyzeMusic)
    │
    ├─ life → lifeService.saveLife() → 呼叫 Gemini (analyzeLife)
    │
    ├─ feedback → feedbackService.generateFeedback()
    │   ├─ 搜尋 SavedItem (by tags)
    │   ├─ 搜尋 Mem0 記憶（語意搜尋）
    │   └─ 呼叫 Gemini (generateFeedbackWithRAG)
    │
    ├─ recommendation → recommendationService.generateRecommendation()
    │   ├─ 搜尋 SavedItem (by tags + text)
    │   ├─ 搜尋 Mem0 記憶（語意搜尋）
    │   └─ 呼叫 Gemini (generateRecommendationWithRAG)
    │
    ├─ chat_history → chatService.searchHistory()
    │   ├─ 搜尋 SavedItem (by tags + text)
    │   ├─ 搜尋 Mem0 記憶（語意搜尋）
    │   └─ 呼叫 Gemini (answerChatHistoryWithRAG)
    │
    └─ other → chatService.saveChat() + chatService.chat()
        ├─ saveChat() → 呼叫 Gemini (analyzeChat)
        ├─ chat() → 搜尋 Mem0 記憶 + 呼叫 Gemini (chat)
        └─ extractMemoryForIntent() → 提取偏好記憶（非同步）
    ↓
服務處理完成後：
    ├─ 儲存到資料庫（SavedItem / Todo / Reminder）
    ├─ 提取並儲存記憶到 Mem0（根據 intent 類型，非同步）
    ├─ 記錄 API 呼叫（用於限制追蹤）
    └─ 透過 messages.ts 發送回應訊息
    ↓
LINE Platform 推送訊息給用戶
```

### 2. 待辦提醒流程

```
Vercel Cron Job（每小時執行）
    ↓
GET /api/cron/check-todo-notifications
    ↓
查詢資料庫：Reminder.status = 'PENDING' AND triggerAt <= now
    ↓
對每個待發送的提醒：
    ├─ 查詢相關 Todo 資訊
    ├─ 構建通知訊息
    ├─ 透過 LINE API 發送 Push Message
    └─ 更新 Reminder.status = 'SENT'
```

### 3. 訊息限制機制

```
用戶發送訊息
    ↓
eventHandler.ts
    ↓
[檢查] checkDailyMessageLimit()
    ├─ 查詢今日所有 tag='api_call' 的 SavedItem
    ├─ 計算數量
    └─ 如果 >= 8 → 返回「今天的幽靈幣用完啦！」
    ↓
如果通過限制：
    ├─ recordApiCall() → 建立 tag='api_call' 的 SavedItem
    └─ 繼續處理訊息
```

---

## API 端點說明

### 公開 API

#### `POST /api/line`
- **用途**：接收 LINE Webhook 事件
- **驗證**：LINE 簽名驗證
- **處理流程**：
  1. 驗證 webhook 簽名
  2. 解析事件內容
  3. 路由到 `eventHandler.ts`
  4. 返回 200 OK

#### `GET /api/cron/check-todo-notifications`
- **用途**：檢查並發送待辦提醒（Cron Job）
- **排程**：每小時執行（`0 * * * *`）
- **認證**：可選的 `CRON_SECRET` Bearer token
- **流程**：
  1. 查詢待發送的提醒
  2. 發送 LINE Push Message
  3. 更新提醒狀態
- **回應**：`{ success, checked, sent, errors, timestamp }`

#### `GET /api/debug?token=<DEBUG_API_TOKEN>`
- **用途**：健康檢查與除錯
- **認證**：`DEBUG_API_TOKEN` query parameter
- **回應**：服務狀態資訊

### Admin API

#### `GET /api/admin/analytics`
- **用途**：取得分析數據
- **參數**：`startDate`, `endDate` (可選)
- **回應**：`{ userStats, conversationStats, intentDistribution, dailyActivity }`

#### `GET /api/admin/conversations`
- **用途**：查詢對話紀錄
- **參數**：`userId`, `userName`, `startDate`, `endDate`, `search`, `page`, `limit`
- **回應**：分頁的對話列表

#### `GET /api/admin/health`
- **用途**：系統健康狀態
- **回應**：`{ success, database, gemini, metrics }`

---

## 意圖分類系統

### 支援的意圖類型

| Intent | SubIntent | 說明 | Gemini API 呼叫 |
|--------|-----------|------|----------------|
| `todo` | `create` | 新增待辦 | `extractMultipleTodos`, `extractTodoDateTime` |
| `todo` | `update` | 更新待辦狀態 | `matchTodoForUpdate` |
| `todo` | `query` | 查詢待辦 | `parseTodoQuery` |
| `link` | - | 分析連結 | `analyzeLink` |
| `insight` | - | 儲存靈感 | `analyzeInsight` |
| `knowledge` | - | 儲存知識 | `analyzeKnowledge` |
| `memory` | - | 儲存記憶 | `analyzeMemory` |
| `music` | - | 儲存音樂 | `analyzeMusic` |
| `life` | - | 儲存活動 | `analyzeLife` |
| `feedback` | - | 生成回饋 | `generateFeedback` |
| `recommendation` | - | 生成推薦 | `generateRecommendation` |
| `chat_history` | - | 查詢對話 | `extractSearchKeywords`, `answerChatHistoryWithRAG` |
| `other` | - | 一般聊天 | `analyzeChat`, `chat` |

### 意圖分類流程

```
用戶訊息
    ↓
intentClassificationService.classify()
    ├─ 呼叫 Gemini API (classifyIntent template)
    └─ 返回分類結果
    ↓
[Fallback] 如果 Gemini 失敗，使用關鍵字匹配
    ↓
[後處理] 檢查是否需要重新分類
    ├─ 問題句 → 轉為 feedback/chat_history
    └─ todo create 包含查詢關鍵字 → 轉為 query
    ↓
返回最終分類結果
```

---

## Gemini API 呼叫統計

### 每次用戶訊息可能觸發的 API 呼叫

1. **意圖分類**（必備，不計入限制）
   - `classifyIntent` × 1

2. **根據意圖的額外呼叫**（計入限制）
   - **todo create**: `extractMultipleTodos` + `extractTodoDateTime` = 2 次
   - **todo update**: `matchTodoForUpdate` = 1 次
   - **todo query**: `parseTodoQuery` = 1 次
   - **link**: `analyzeLink` = 1 次
   - **insight/knowledge/memory/music/life**: `analyze*` = 1 次
   - **feedback**: `generateFeedback` = 1 次
   - **recommendation**: `generateRecommendation` = 1 次
   - **chat_history**: `extractSearchKeywords` + `answerChatHistoryWithRAG` = 2 次
   - **other**: `analyzeChat` + `chat` = 2 次

### 訊息限制機制

- **限制**：每個用戶每天 8 次 API 呼叫（不包括意圖分類）
- **追蹤**：每次 API 呼叫會建立 `tag='api_call'` 的 SavedItem
- **檢查時機**：在處理訊息前檢查今日用量
- **內建功能**：使用教學、查看幽靈幣不計入限制

---

## 資料庫結構

### 主要資料表

```
User
├─ id (String, PK)
├─ displayName
├─ email
├─ locale
├─ timeZone
└─ 關聯：savedItems, reminders, todos

SavedItem
├─ id (String, PK)
├─ userId (FK → User)
├─ title
├─ content
├─ url
├─ tags (String[])
├─ metadata (JSON)
└─ 用途：儲存所有類型的內容（chat, insight, knowledge, memory, music, life, link, api_call）

Todo
├─ id (String, PK)
├─ userId (FK → User)
├─ title
├─ description
├─ status (PENDING | DONE | CANCELLED)
├─ date (DateTime, 行程時間)
├─ due (DateTime, 截止時間)
└─ 關聯：reminders

Reminder
├─ id (String, PK)
├─ userId (FK → User)
├─ todoId (FK → Todo, 可選)
├─ title
├─ triggerAt (DateTime)
├─ status (PENDING | SENT | CANCELLED)
└─ sentAt (DateTime, 可選)
```

---

## Mem0 記憶引擎整合

### 記憶提取策略

系統針對不同意圖類型，採用不同的記憶提取策略：

| 意圖類型 | 提取的記憶類型 | 範例 |
|---------|--------------|------|
| `todo` | 用戶習慣和模式 | 「用戶習慣在週六買牛奶」 |
| `link` | 用戶興趣和主題 | 「用戶對 React Server Components 的技術文章感興趣」 |
| `save_content` | 關鍵字與標籤 | 「用戶記錄了 React 相關知識」 |
| `query` | 查詢習慣或新資訊 | 「用戶有筆記顏色分類的習慣」（如果有新資訊） |
| `other` | 個人偏好、性格特徵、生活現況 | 「用戶喜歡爵士樂」、「用戶最近搬到汐止」 |

### 記憶儲存流程

```
用戶訊息
    ↓
意圖分類（intent）
    ↓
根據 intent 調用 extractMemoryForIntent()
    ├─ todo → extractTodoMemory (提取習慣)
    ├─ link → extractLinkMemory (提取興趣)
    ├─ save_content → extractSaveContentMemory (提取關鍵字)
    ├─ query → extractQueryMemory (提取新資訊，可能為 null)
    └─ other → extractOtherMemory (提取偏好)
    ↓
LLM 提取結構化記憶（JSON）
    ↓
儲存到 Mem0 (addConversation with category)
```

### 記憶檢索流程

```
用戶查詢（feedback/recommendation/chat）
    ↓
搜尋 Mem0 (searchRelevantMemories)
    ├─ 語意搜尋（semantic search）
    ├─ 分類過濾（categories: ['todo', 'other', ...]）
    └─ 日期過濾（parseDateFromQuery: "1/17"）
    ↓
同時搜尋 SavedItem (searchByTags/searchByText)
    ↓
合併結果作為 RAG context
    ├─ Mem0 記憶（格式：相關背景記憶：\n1. [YYYY-MM-DD] 記憶內容）
    └─ SavedItem（格式：- 標題 [標籤]）
    ↓
生成回應（generateFeedbackWithRAG / generateRecommendationWithRAG）
```

### 記憶 Provider 抽象層

系統採用抽象層設計，支援多種記憶後端：

```typescript
interface IMemoryProvider {
  searchRelevantMemories(userId, query, limit?, categories?): Promise<string>;
  addConversation(userId, messages, category?): Promise<void>;
}
```

**目前實作**：
- ✅ `Mem0HostedProvider`: 使用 Mem0 hosted API（預設）
- 🔜 `UpstashProvider`: Upstash Vector（預留）
- 🔜 `PostgreSQLProvider`: PostgreSQL + pgvector（預留）

**切換方式**：
```bash
# 使用 Mem0 hosted（預設）
MEMORY_PROVIDER=mem0
MEM0_API_KEY=your-mem0-api-key

# 使用 Upstash（未來）
MEMORY_PROVIDER=upstash
UPSTASH_VECTOR_REST_URL=...
UPSTASH_VECTOR_REST_TOKEN=...

# 使用 PostgreSQL（未來）
MEMORY_PROVIDER=postgresql
# 使用 DATABASE_URL
```

---

## 環境變數設定

```bash
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-line-token
LINE_CHANNEL_SECRET=your-line-secret

# Google Gemini API
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash  # 可選，預設為 gemini-2.0-flash

# 資料庫
DATABASE_URL=postgresql://user:password@localhost:5432/booboo_db

# Mem0 記憶引擎（可選，但強烈建議）
MEMORY_PROVIDER=mem0  # 預設為 mem0，可選：mem0, upstash, postgresql, none
MEM0_API_KEY=your-mem0-api-key  # Mem0 hosted API key

# 除錯
DEBUG_API_TOKEN=local-debug-token

# Cron Job 認證（可選）
CRON_SECRET=your-cron-secret

# LIFF Admin（可選）
LIFF_ADMIN_URL=https://liff.line.me/YOUR_LIFF_ID

# 系統設定（可選）
DEFAULT_REGULAR_TOKEN_LIMIT=10  # 一般用戶 token 上限
DEFAULT_VIP_TOKEN_LIMIT=200     # VIP 用戶 token 上限
```

---

## 開發流程

### 初始化

```bash
# 安裝依賴
yarn install

# 複製環境變數
cp env.example .env.local

# 設定環境變數（見上方）

# 生成 Prisma Client
yarn prisma:generate

# 執行資料庫遷移
yarn prisma:migrate dev
```

### 本地開發

```bash
# 啟動開發伺服器
yarn dev

# 使用 ngrok 暴露本地服務
ngrok http 3000

# 在 LINE Developers 設定 Webhook URL
# https://<your-ngrok-url>.ngrok.io/api/line
```

### 部署

```bash
# 建置專案
yarn build

# Vercel 會自動部署
# 記得在 Vercel 設定環境變數
```

---

## 專案結構

```
hw6/
├── src/
│   ├── app/
│   │   ├── api/              # API 路由
│   │   │   ├── line/         # LINE Webhook
│   │   │   ├── cron/         # Cron Jobs
│   │   │   ├── admin/        # Admin API
│   │   │   └── debug/        # 除錯端點
│   │   └── admin/            # Admin Dashboard
│   │
│   ├── bot/                  # Bot 相關
│   │   ├── eventHandler.ts   # 事件處理器
│   │   ├── webhookHandler.ts # Webhook 處理
│   │   ├── messages.ts       # 訊息模板
│   │   └── lineBot.ts        # LINE Client
│   │
│   ├── services/             # 業務邏輯層
│   │   ├── intentClassificationService.ts
│   │   ├── todoService.ts
│   │   ├── chatService.ts
│   │   ├── geminiService.ts
│   │   └── promptManager.ts
│   │
│   ├── repositories/         # 資料存取層
│   │   ├── index.ts
│   │   └── prismaClient.ts
│   │
│   ├── domain/               # 領域模型
│   │   └── schemas.ts
│   │
│   ├── utils/                # 工具函數
│   │   ├── messageLimit.ts
│   │   ├── logger.ts
│   │   └── questionDetector.ts
│   │
│   └── container.ts          # 依賴注入
│
├── prisma/
│   ├── schema.prisma         # 資料庫 Schema
│   └── migrations/           # 遷移檔案
│
├── vercel.json               # Vercel 設定（Cron Jobs）
└── README.md                 # 本文件
```

---

## 錯誤處理

### 錯誤類型

1. **429 Too Many Requests**（Gemini API 配額超限）
   - 回應：「小幽今天處理太多請求了，有點累...讓我休息一下，晚點再來找我聊天吧～ 😴」

2. **一般錯誤**
   - 回應：「小幽現在有點忙碌，請稍後再試一次 🙏」

3. **訊息限制超限**
   - 回應：「今天的幽靈幣用完啦！明天再來找我聊天吧～ 👻」

### 日誌系統

- 使用結構化日誌（`logger.ts`）
- 所有錯誤都會記錄到 Vercel Logs
- 包含：錯誤訊息、堆疊追蹤、用戶 ID、時間戳記

---

## 限制與注意事項

### Vercel 限制

- **Cron Jobs**：Pro 計劃支援多個 cron job，免費計劃有限制
- **Serverless Functions**：執行時間限制（Hobby: 10s, Pro: 60s）
- **API 配額**：根據計劃不同

### Gemini API 限制

- **免費層**：每天 200 次請求
- **錯誤處理**：429 錯誤會自動回應用戶
- **Fallback**：API 失敗時使用關鍵字匹配

### 訊息限制

- **每日限制**：每個用戶每天 8 次 API 呼叫
- **不計入限制**：意圖分類、內建功能（使用教學、查看幽靈幣）
- **追蹤方式**：透過 `tag='api_call'` 的 SavedItem

---

## 未來擴展

- [ ] 支援更多時間範圍查詢
- [ ] 改進意圖分類準確度
- [ ] 添加更多 Quick Reply 選項
- [ ] 支援語音訊息
- [ ] 整合更多外部服務
- [ ] 改進錯誤恢復機制

---
