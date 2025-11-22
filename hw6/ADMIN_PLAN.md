# Admin Dashboard 實作計劃

## 架構設計

### 資料夾結構
```
src/
├── admin/                    # Admin 功能（與 bot 分離）
│   ├── services/            # 業務邏輯層
│   │   ├── conversationService.ts
│   │   ├── analyticsService.ts
│   │   └── healthService.ts
│   ├── repositories/        # 資料存取層
│   │   ├── conversationRepository.ts
│   │   └── analyticsRepository.ts
│   ├── components/          # React 組件
│   │   ├── ConversationList.tsx
│   │   ├── ConversationFilters.tsx
│   │   ├── StatsCard.tsx
│   │   ├── IntentChart.tsx
│   │   ├── UserActivityChart.tsx
│   │   └── HealthStatus.tsx
│   └── views/               # 頁面視圖
│       ├── ConversationsView.tsx
│       ├── AnalyticsView.tsx
│       └── HealthView.tsx
├── app/
│   └── admin/               # Admin 路由
│       ├── page.tsx         # Dashboard 主頁
│       ├── conversations/
│       │   └── page.tsx
│       ├── analytics/
│       │   └── page.tsx
│       └── health/
│           └── page.tsx
└── app/api/admin/           # Admin API 路由
    ├── conversations/
    │   └── route.ts
    ├── analytics/
    │   └── route.ts
    └── health/
        └── route.ts
```

## 實作步驟

### 1. 安裝依賴
- @mui/material, @mui/icons-material
- @emotion/react, @emotion/styled
- recharts
- @tanstack/react-query
- date-fns (日期處理)

### 2. 後端 Repository 層
**`src/admin/repositories/conversationRepository.ts`**
- `listConversations(filters)` - 查詢對話紀錄（SavedItem with "chat" tag）
- 支援 userId、日期區間、內容搜尋篩選

**`src/admin/repositories/analyticsRepository.ts`**
- `getUserStats()` - 總使用者數、活躍使用者數
- `getConversationStats(dateRange)` - 對話數統計、趨勢
- `getIntentDistribution(dateRange)` - Intent 分類統計（從 SavedItem tags 分析）
- `getDailyActivity(dateRange)` - 每日活動趨勢

### 3. 後端 Service 層
**`src/admin/services/conversationService.ts`**
- 處理對話紀錄查詢邏輯
- 格式化回應資料

**`src/admin/services/analyticsService.ts`**
- 計算統計數據
- 處理日期區間邏輯
- Intent 分類分析（從 SavedItem tags 提取）

**`src/admin/services/healthService.ts`**
- 健康檢查端點
- 從 logger 分析錯誤率（需要新增 log 記錄機制或從現有 log 分析）
- 回應時間統計（需要新增 middleware 記錄）

### 4. 後端 API Routes
**`app/api/admin/conversations/route.ts`**
- GET: 查詢對話紀錄
- Query params: userId, startDate, endDate, search, page, limit

**`app/api/admin/analytics/route.ts`**
- GET: 取得統計數據
- Query params: startDate, endDate

**`app/api/admin/health/route.ts`**
- GET: 健康檢查和效能指標

### 5. 前端 Components
**`src/admin/components/StatsCard.tsx`**
- 綠色卡片樣式（參考圖片）
- 顯示總對話數、活躍使用者等

**`src/admin/components/IntentChart.tsx`**
- 圓餅圖（使用 Recharts）
- 顯示 Intent 分類分布

**`src/admin/components/UserActivityChart.tsx`**
- 折線圖或柱狀圖
- 顯示每日活動趨勢

**`src/admin/components/ConversationList.tsx`**
- 對話列表
- 支援分頁

**`src/admin/components/ConversationFilters.tsx`**
- 篩選表單（使用者、日期區間、搜尋）

**`src/admin/components/HealthStatus.tsx`**
- 健康狀態顯示
- 回應時間、錯誤率指標

### 6. 前端 Views
**`src/admin/views/ConversationsView.tsx`**
- 整合 ConversationList 和 ConversationFilters
- 使用 React Query 管理資料

**`src/admin/views/AnalyticsView.tsx`**
- Dashboard 樣式
- 整合多個統計卡片和圖表
- 頂部日期選擇器（參考圖片）

**`src/admin/views/HealthView.tsx`**
- 健康監控面板

### 7. 前端 Pages
**`app/admin/page.tsx`**
- 主 Dashboard，顯示總覽

**`app/admin/conversations/page.tsx`**
- 對話紀錄頁面

**`app/admin/analytics/page.tsx`**
- 統計分析頁面

**`app/admin/health/page.tsx`**
- 健康監控頁面

### 8. UI 風格實作
- 使用 MUI Theme 設定綠色主色調
- 參考圖片設計：綠色卡片、白色卡片、圓餅圖
- 響應式設計

### 9. 效能監控增強
- 在 `app/api/line/route.ts` 新增 middleware 記錄回應時間
- 記錄 intent 分類結果到 metadata 或 log
- 錯誤追蹤機制

## 技術細節

### Intent 分類統計
從 SavedItem 的 tags 分析：
- 有 "chat" tag 的項目 = 對話紀錄
- 其他 tags (insight, knowledge, memory, etc.) = 各類 intent 的儲存

### 對話紀錄查詢
```typescript
// 查詢條件
{
  tags: { has: 'chat' },
  userId?: string,
  createdAt: { gte: startDate, lte: endDate },
  content: { contains: searchText }
}
```

### 統計數據計算
- 活躍使用者：在指定時間內有對話的使用者
- Intent 分布：從 SavedItem tags 統計（排除 "chat" tag）
- 趨勢圖：按日期分組統計

## 注意事項
1. 所有 admin 功能與 bot 功能完全分離
2. 使用 Prisma 查詢，不直接操作資料庫
3. 前端使用 React Query 管理 server state
4. 響應式設計，支援行動裝置
5. 錯誤處理和 loading 狀態