# 🗺️ 尋寶地圖應用

一個基於 React + Next.js + Express + PostgreSQL 的全端地圖應用，讓用戶可以在地圖上創建、分享和探索各種「寶藏」。

<!-- 應用截圖 -->
<!-- ![應用首頁](docs/images/screenshots/homepage.png) -->

<div align="center">
  <!-- <img src="docs/images/logos/logo.png" alt="尋寶地圖 Logo" width="200"> -->
  <p><em>🚧 截圖和 Logo 即將上線！請將相關圖片放置在 <code>docs/images/</code> 資料夾中。</em></p>
</div>

## 📋 功能特色

- 🗺️ **互動式地圖**：基於 Google Maps API 的地圖介面
- 📍 **寶藏管理**：創建、編輯、刪除和瀏覽寶藏
- ❤️ **社交功能**：按讚、收藏、留言系統
- 👤 **用戶系統**：Google OAuth 登入、個人資料管理
- 📱 **響應式設計**：支援桌面和行動裝置
- 🔍 **搜尋篩選**：依類型、標籤、位置搜尋寶藏

## 🚀 一鍵啟動

### 前置需求

在開始之前，請確保您的系統已安裝：

- **Docker** 和 **Docker Compose**
- **Node.js** (版本 18 或以上)
- **npm** (通常隨 Node.js 一起安裝)

### 快速開始

#### macOS / Linux

```bash
# 1. 克隆項目
git clone <repository-url>
cd hw4

# 2. 執行一鍵啟動腳本
chmod +x start.sh
./start.sh
```

#### Windows

```batch
# 1. 克隆項目
git clone <repository-url>
cd hw4

# 2. 執行一鍵啟動腳本
start.bat
```

### 腳本功能

啟動腳本會自動執行以下操作：

1. ✅ **環境檢查**：檢查 Docker、Node.js 等必要工具
2. ✅ **依賴安裝**：自動安裝前後端 npm 套件
3. ✅ **Docker 服務**：啟動 PostgreSQL、Redis、pgAdmin
4. ✅ **資料庫設置**：Prisma 遷移、種子資料
5. ✅ **環境配置**：創建預設 .env 文件
6. ✅ **服務啟動**：同時啟動前端和後端服務

## 🌐 訪問應用

啟動完成後，您可以訪問：

- **前端應用**：http://localhost:3000
- **後端 API**：http://localhost:3001
- **API 文檔**：http://localhost:3001/api-docs
- **資料庫管理**：http://localhost:8080 (pgAdmin)

### 預設登入資訊

- **pgAdmin**：
  - Email: `admin@treasure-map.com`
  - Password: `admin123`

## ⚙️ 環境配置

### Google Maps API 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新項目或選擇現有項目
3. 啟用 Maps JavaScript API 和 Places API
4. 創建 API 金鑰
5. 將 API 金鑰填入 `frontend/.env.local`：

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

### Google OAuth 設定

1. 在 Google Cloud Console 中設定 OAuth 2.0
2. 設定授權重新導向 URI：`http://localhost:3001/api/auth/google/callback`
3. 將憑證填入 `backend/.env`：

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

4. 將客戶端 ID 填入 `frontend/.env.local`：

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🛑 停止服務

### macOS / Linux

```bash
./stop.sh
```

### Windows

```batch
stop.bat
```

或者按 `Ctrl+C` 停止啟動腳本。

## 📁 項目結構

```
hw4/
├── backend/                 # 後端 API (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 業務邏輯
│   │   ├── routes/          # 路由定義
│   │   ├── middleware/      # 中間件
│   │   └── types/           # 類型定義
│   ├── prisma/              # 資料庫結構和種子
│   └── package.json
├── frontend/                # 前端應用 (Next.js + React)
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # React 組件
│   │   ├── hooks/           # 自定義 Hooks
│   │   ├── services/        # API 服務
│   │   └── types/           # 類型定義
│   └── package.json
├── docker-compose.yml       # Docker 服務配置
├── start.sh                 # Unix 啟動腳本
├── start.bat                # Windows 啟動腳本
├── stop.sh                  # Unix 停止腳本
├── stop.bat                 # Windows 停止腳本
└── README.md                # 項目說明
```

## 🔧 開發指令

### 後端開發

```bash
cd backend

# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置
npm run build

# 生產模式
npm start

# 資料庫操作
npm run db:generate    # 生成 Prisma 客戶端
npm run db:push        # 推送資料庫結構
npm run db:migrate     # 執行遷移
npm run db:seed        # 執行種子資料
npm run db:studio      # 開啟 Prisma Studio

# 測試
npm test
npm run test:watch
npm run test:coverage
```

### 前端開發

```bash
cd frontend

# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置
npm run build

# 生產模式
npm start

# 程式碼檢查
npm run lint
```

### Docker 操作

```bash
# 啟動所有服務
docker-compose up -d

# 啟動特定服務
docker-compose up -d postgres redis

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down

# 重建並啟動
docker-compose up -d --build
```

## 🐛 故障排除

### 常見問題

1. **Docker 啟動失敗**
   - 確保 Docker Desktop 正在運行
   - 檢查端口 5432、6379、8080 是否被佔用

2. **資料庫連接失敗**
   - 等待 PostgreSQL 完全啟動（約 10-15 秒）
   - 檢查 `backend/.env` 中的 `DATABASE_URL`

3. **前端無法載入地圖**
   - 確保已設定 Google Maps API 金鑰
   - 檢查 API 金鑰權限和配額

4. **Google 登入失敗**
   - 確保 OAuth 設定正確
   - 檢查重新導向 URI 設定

### 日誌檢查

- 後端日誌：`logs/backend.log`
- 前端日誌：`logs/frontend.log`
- Docker 日誌：`docker-compose logs`

### 重置資料庫

```bash
cd backend
npm run db:clean    # 清空資料庫
npm run db:push     # 重新建立結構
npm run db:seed     # 重新載入種子資料
```

## 📚 API 文檔

啟動應用後，訪問 http://localhost:3001/api-docs 查看完整的 API 文檔。

主要 API 端點：

- `POST /api/auth/login` - 用戶登入
- `GET /api/treasures` - 獲取寶藏列表
- `POST /api/treasures` - 創建寶藏
- `PUT /api/treasures/:id` - 更新寶藏
- `DELETE /api/treasures/:id` - 刪除寶藏
- `POST /api/treasures/:id/like` - 按讚/取消按讚
- `POST /api/treasures/:id/favorite` - 收藏/取消收藏

## 🤝 貢獻指南

1. Fork 此項目
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權

此項目採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🆘 支援

如果您遇到問題或需要幫助：

1. 查看 [故障排除](#-故障排除) 部分
2. 檢查 [Issues](../../issues) 是否有類似問題
3. 創建新的 Issue 描述您的問題

---

**享受探索寶藏的樂趣！** 🎉
