# Treasure Map Backend API

完整的寶藏地圖後端 API，使用 Express.js、TypeScript、Prisma ORM 和 PostgreSQL 開發。

## 🚀 功能特色

- **認證系統**: Google OAuth 2.0 + JWT
- **RESTful API**: 完整的 CRUD 操作
- **資料庫**: PostgreSQL + Prisma ORM
- **文件上傳**: 支援圖片、音檔、影片
- **地理位置**: 基於經緯度的寶藏搜尋
- **API 文件**: Swagger/OpenAPI 3.0
- **容器化**: Docker Compose 本地開發環境

## 📋 系統需求

- Node.js 18+
- Docker & Docker Compose
- Git

## 🛠️ 快速開始

### 1. 安裝依賴

```bash
cd hw4/backend
npm install
```

### 2. 環境設定

複製環境變數範例並修改：

```bash
cp .env.example .env
```

編輯 `.env` 文件，設定必要的環境變數：

```bash
# 重要：請更改這些密鑰
可以用 ```openssl rand -base64 32``` 產生
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production

# Google OAuth (需要申請)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. 啟動資料庫

使用 Docker Compose 啟動本地資料庫環境：

```bash
npm run docker:up
```

這會啟動：
- PostgreSQL 資料庫 (port 5432)
- Redis 快取 (port 6379)  
- pgAdmin 管理介面 (port 5050)

### 4. 初始化資料庫

產生 Prisma 客戶端並執行資料庫遷移：

```bash
npm run db:generate
npm run db:push
```

### 5. 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 http://localhost:8080 啟動

## 📚 API 文件

啟動伺服器後，可在以下位置查看 API 文件：

- **Swagger UI**: http://localhost:8080/api-docs
- **健康檢查**: http://localhost:8080/health

## 🗄️ 資料庫管理

### Prisma Studio
使用圖形化介面管理資料庫：

```bash
npm run db:studio
```

在 http://localhost:5555 開啟

### pgAdmin
使用 pgAdmin 管理 PostgreSQL：

1. 開啟 http://localhost:5050
2. 登入資訊：
   - Email: admin@admin.com
   - Password: admin

### 資料庫遷移

```bash
# 產生新的遷移
npm run db:migrate

# 直接推送 schema 變更 (開發用)
npm run db:push
```

## 🔧 開發指令

```bash
# 開發模式 (熱重載)
npm run dev

# 建構專案
npm run build

# 生產模式執行
npm start

# 資料庫相關
npm run db:generate    # 產生 Prisma 客戶端
npm run db:push        # 推送 schema 到資料庫
npm run db:migrate     # 執行資料庫遷移
npm run db:studio      # 開啟 Prisma Studio

# Docker 相關
npm run docker:up      # 啟動資料庫容器
npm run docker:down    # 停止並移除容器
npm run docker:logs    # 查看容器日誌
```

## 🏗️ 專案結構

```
backend/
├── src/
│   ├── app.ts              # Express 應用程式設定
│   ├── server.ts           # 伺服器啟動檔案
│   ├── types/              # TypeScript 類型定義
│   ├── config/             # 配置檔案 (Swagger)
│   ├── middleware/         # 中介軟體
│   │   ├── auth.ts         # 認證中介軟體
│   │   ├── errorHandler.ts # 錯誤處理
│   │   ├── validation.ts   # 資料驗證
│   │   └── notFoundHandler.ts
│   ├── controllers/        # 控制器
│   │   ├── authController.ts
│   │   └── treasureController.ts
│   ├── routes/             # 路由定義
│   │   ├── auth.ts
│   │   ├── treasures.ts
│   │   ├── users.ts
│   │   ├── comments.ts
│   │   └── uploads.ts
│   └── services/           # 業務邏輯服務 (待實作)
├── prisma/
│   ├── schema.prisma       # 資料庫 Schema
│   └── migrations/         # 資料庫遷移檔案
├── uploads/                # 檔案上傳目錄
├── docker-compose.yml      # Docker 配置
├── tsconfig.json          # TypeScript 配置
└── package.json
```

## 🔌 API 端點

### 認證 (Authentication)
- `POST /api/auth/login` - Google OAuth 登入
- `POST /api/auth/refresh` - 刷新 access token
- `GET /api/auth/profile` - 取得用戶資料
- `POST /api/auth/logout` - 登出

### 寶藏 (Treasures)
- `GET /api/treasures` - 取得寶藏列表 (支援地理位置搜尋)
- `GET /api/treasures/:id` - 取得特定寶藏
- `POST /api/treasures` - 建立新寶藏 🔒
- `PUT /api/treasures/:id` - 更新寶藏 🔒
- `DELETE /api/treasures/:id` - 刪除寶藏 🔒

🔒 = 需要認證

## 🔐 認證流程

1. **前端**: 使用 Google OAuth 取得 ID token
2. **後端**: 驗證 Google token 並建立/更新用戶
3. **後端**: 回傳 JWT access token 和 refresh token
4. **前端**: 在 API 請求中使用 Bearer token
5. **Token 刷新**: 使用 refresh token 取得新的 access token

## 🌍 地理位置搜尋

API 支援基於地理位置的寶藏搜尋：

```bash
GET /api/treasures?latitude=25.0330&longitude=121.5654&radius=5
```

參數說明：
- `latitude`: 搜尋中心緯度
- `longitude`: 搜尋中心經度  
- `radius`: 搜尋半徑 (公里，預設 10km)

## 🏷️ 標籤系統

寶藏支援多標籤分類：

```bash
GET /api/treasures?tags=music,travel,memory
```

## 📝 資料驗證

所有 API 端點都包含完整的資料驗證：
- 必填欄位檢查
- 資料類型驗證  
- 長度限制
- UUID 格式驗證
- 地理座標範圍驗證

## 🚦 錯誤處理

API 使用統一的錯誤回應格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

## 🔧 故障排除

### 資料庫連線問題
```bash
# 檢查容器狀態
docker-compose ps

# 重啟資料庫
npm run docker:down
npm run docker:up
```

### Prisma 相關問題
```bash
# 重新產生客戶端
npm run db:generate

# 重置資料庫 (小心：會清除資料)
npx prisma migrate reset
```

### 環境變數問題
確保 `.env` 檔案存在且包含所有必要的變數。

## 📈 生產部署

1. 設定生產環境變數
2. 建構專案: `npm run build`
3. 執行資料庫遷移: `npm run db:migrate`
4. 啟動: `npm start`

## 🤝 開發協作

### Git 工作流程
1. 建立功能分支
2. 實作功能
3. 提交 Pull Request
4. Code Review
5. 合併到主分支

### 程式碼規範
- 使用 TypeScript 嚴格模式
- 遵循 RESTful API 設計
- 適當的錯誤處理
- 完整的 API 文件

## 📞 支援

如有問題請聯繫開發團隊或建立 Issue。