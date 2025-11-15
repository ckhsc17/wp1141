## 專案簡介

`line-course-bot` 是以 Next.js App Router 為基礎、搭配 Bottender 打造的 LINE 課程諮詢助教。Bot 會依據台大電機系《Web Programming》課程資訊提供繁體中文與英文的課程簡介、作業與評分說明、期末專題重點等內容，並支援 quick reply、buttons 與 carousel 模板互動。

## 環境需求

- Node.js 18 以上
- Yarn 1.x（請勿使用 npm / pnpm / bun）
- LINE Developers 平台上的 Messaging API channel（取得 access token 與 channel secret）

## 初始化步驟

```bash
# 安裝相依套件
yarn install

# 建立環境變數檔
cp env.example .env.local
```

請在 `.env.local` 中填入下列變數：

```bash
LINE_CHANNEL_ACCESS_TOKEN=你的LINE access token
LINE_CHANNEL_SECRET=你的LINE channel secret
```

## 開發流程

```bash
# 啟動開發伺服器（http://localhost:3000）
yarn dev

# 靜態檢查
yarn lint

# 打包
yarn build
```

## LINE Webhook 設定

1. 將專案部署到 Vercel（或其他具備 Node.js Runtime 的平台），並確認部署網址。
2. 在 LINE Developers 後台設定 webhook URL，格式為 `https://<你的網域>/api/line`。
3. 啟用 webhook，並在「Messaging API」分頁中將 `LINE_CHANNEL_ACCESS_TOKEN` 與 `LINE_CHANNEL_SECRET` 填入 `.env.local` 或 Vercel 專案環境變數中。

## Bot 互動功能

- **文字內容**：依據使用者輸入回傳課程內容、作業、期末專題、評分方式、修課要求等資訊。
- **快速回覆**：提供課程內容、作業說明、期末專題、評分方式、修課要求、更多資訊、切換語言等捷徑。
- **Buttons 模板**：顯示課程主選單，快速導向常見問題。
- **Carousel 模板**：提供期末專題、修課資源與授課教師等進階資訊。
- **語系切換**：輸入「切換語言 / Language」或直接輸入「繁體中文 / English」即可在繁中與英文介面間切換。

## 專案結構重點

- `src/app/api/line/route.ts`：Next.js Webhook 端點，將 LINE 請求交由 Bottender 處理。
- `src/bot/`：封裝 LINE Bot 實例、事件處理與訊息模板。
- `src/lib/`：儲存多語系內容、語系狀態、關鍵字對應等工具模組。
- `bottender.config.ts`：Bottender 設定，採用記憶體 Session。

## 部署建議

- Vercel 預設使用 Node.js Runtime，已足以支援 Bottender webhook。
- 建議在部署前於本機以 [ngrok](https://ngrok.com/) 等工具測試 webhook。
- 部署後請在 LINE Developers 後台使用「發送測試事件」驗證是否能收到回覆。
