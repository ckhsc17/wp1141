## 專案簡介

**Booboo 小幽** 是一個幫你把生活中的連結、靈感、提醒與情緒整理成「可行動智慧」的 LINE 助理。把任何訊息丟給小幽，它會透過 Gemini API 分析內容、分類並存入個人資料庫，必要時主動提醒或給出洞察。專案採 Next.js App Router + Bottender，並以 Service Layer + Repository Pattern 撰寫，方便後續接入 Supabase。

## 環境需求

- Node.js 18 以上
- Yarn 1.x（請勿使用 npm / pnpm / bun）
- LINE Developers 上的 Messaging API channel
- Google Gemini API key

## 初始化步驟

```bash
yarn install
cp env.example .env.local
```

`.env.local` 內容範例：

```bash
LINE_CHANNEL_ACCESS_TOKEN=your-line-token
LINE_CHANNEL_SECRET=your-line-secret
GEMINI_API_KEY=your-gemini-key
DEBUG_API_TOKEN=local-debug-token
```

> 尚未接上正式資料庫前，可直接使用預設的 InMemory repository，或自行啟動 `podman-compose up -d` 連到測試資料庫。

## 開發流程

```bash
yarn dev      # 啟動 Next.js + Bottender
yarn lint     # 靜態檢查
yarn build    # 打包
```

## LINE Webhook 設定

1. 啟動本機服務後，用 ngrok 將 `https://<隨機>.ngrok.io/api/line` 提供給 LINE。
2. 在 LINE Developers 後台啟用 webhook 並填入 URL。
3. 部署雲端時記得設定 `LINE_*` 和 `GEMINI_API_KEY` 環境變數。

## 互動功能

- **靈感/連結收藏**：貼上任何文字或網址，小幽會用 Gemini 分析分類並存入 `SavedItem`，回傳 Flex 氣泡摘要。
- **提醒建立**：輸入「提醒我…」，即會建立提醒（目前預設 +1 小時，可再延伸成自訂時間）。
- **生活洞察**：輸入「查看洞察／分析一下」，小幽會聚合近期紀錄並產出 actionable steps。
- **Quick Reply**：提供「新增靈感 / 設定提醒 / 查看洞察」三個常用捷徑。

## 架構重點

- `src/domain/`：以 Zod 定義 `UserProfile`、`SavedItem`、`Reminder`、`Insight` 等資料模型。
- `src/repositories/`：Repository pattern，目前提供 `InMemory*Repository`，日後可替換為 `Supabase*Repository`。
- `src/services/`：
  - `contentService`：透過 Gemini 分類並儲存分享內容。
  - `reminderService`：負責提醒驗證與儲存。
  - `insightService`：聚合紀錄並向 Gemini 生成洞察。
  - `promptManager` / `geminiService`：集中管理 Prompt 與 Gemini 呼叫。
- `src/container.ts`：簡易 Service Locator，統一初始化 repository & service。
- `src/bot/messages.ts`：新的 Flex/Quick Reply 模板。
- `src/utils/logger.ts`、`src/utils/errors.ts`：集中式結構化日誌與錯誤分類。
- `/api/debug`：帶 `token` 的健康檢查（`DEBUG_API_TOKEN` 用於開發期）。

## 除錯

- `GET /api/debug?token=<DEBUG_API_TOKEN>` 可快速確認服務層是否正常。
- `GeminiService` 若未設定 API key 會 fallback 並在 log 中警示。
- 所有 LINE webhook 事件皆會寫入結構化 log，方便在 Vercel 或本機追蹤。

## 部署建議

- 可先部署在 Vercel Node.js Runtime；若仍遇到 `socket hang up`，可考慮 Edge Runtime 或將 `/api/line` 拆到長駐主機。
- 未來接 Supabase 時，只需新增 Repository 實作並在 `container.ts` 切換注入。
- 若需要更多可靠的提醒與排程，可外掛 Supabase cron、Cloud Scheduler 或專屬 worker。


