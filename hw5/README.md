# Twitter/X Clone - Full-Stack Social Media App

一個使用 Next.js 全端框架打造的社交媒體應用，模擬 Twitter/X 的核心功能。

## 技術棧

### 全端框架
- **Next.js 16** - React 全端框架 (App Router + API Routes)
- **React 19** - UI 函式庫
- **TypeScript** - 類型安全

### 認證與資料庫
- **NextAuth.js v4** - 認證系統 (Google/GitHub/Facebook OAuth)
- **Prisma ORM** - 資料庫 ORM
- **PostgreSQL** - 關聯式資料庫 (Docker)

### UI 與樣式
- **MUI (Material-UI)** - UI 組件庫
- **Tailwind CSS** - CSS 框架
- **Emotion** - CSS-in-JS

### 資料管理
- **TanStack Query (React Query)** - 資料快取與狀態管理
- **Axios** - HTTP 客戶端
- **React Hook Form** - 表單處理

### 驗證
- **Zod** - Schema 驗證

### 文件
- **Swagger UI** - API 文件工具

## 專案架構

### 分層架構設計

```
hw5/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes (後端)
│   │   ├── (auth)/               # 認證相關頁面
│   │   ├── profile/              # 個人頁面
│   │   └── post/                 # 貼文頁面
│   ├── components/               # React 組件
│   ├── server/                   # 後端邏輯
│   │   ├── controllers/          # 控制器層
│   │   ├── services/             # 業務邏輯層
│   │   └── repositories/         # 資料存取層
│   ├── schemas/                  # Zod 驗證 schemas
│   ├── lib/                      # 工具函式
│   │   ├── prisma.ts             # Prisma Client
│   │   └── auth.ts               # NextAuth 配置
│   ├── hooks/                    # Custom Hooks
│   └── types/                    # TypeScript 類型
├── prisma/
│   ├── schema.prisma             # 資料庫 Schema
│   ├── seed.ts                   # 測試資料
│   └── migrations/               # 資料庫遷移
├── docker-compose.yml            # Docker 配置
├── package.json
└── README.md
```

### 層級說明

#### 1. API Routes 層
- **位置**: `src/app/api/`
- **職責**: 處理 HTTP 請求/回應、認證檢查
- **範例**: `src/app/api/posts/route.ts`

#### 2. Controller 層
- **位置**: `src/server/controllers/`
- **職責**: 驗證輸入、呼叫 Service、處理錯誤
- **範例**: `postController.ts`, `likeController.ts`

#### 3. Service 層
- **位置**: `src/server/services/`
- **職責**: 業務邏輯、資料處理
- **範例**: `postService.ts`, `likeService.ts`

#### 4. Repository 層
- **位置**: `src/server/repositories/`
- **職責**: 資料庫操作、CRUD
- **範例**: `postRepository.ts`, `likeRepository.ts`

## 快速開始

### 前置需求
- Node.js 18+
- Docker & Docker Compose
- npm 或 yarn

### 安裝步驟

1. **複製專案**
```bash
cd hw5
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動資料庫**
```bash
npm run docker:up
```

4. **設定環境變數**
建立 `.env` 檔案：
```env
# Database
DATABASE_URL="postgresql://twitter_user:twitter_password@localhost:5432/twitter_clone?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

5. **執行資料庫遷移**
```bash
npm run db:migrate
```

6. **產生測試資料**
```bash
npm run db:seed
```

7. **啟動開發伺服器**
```bash
npm run dev
```

訪問 http://localhost:3000

## 開發指令

```bash
# 開發伺服器
npm run dev

# 資料庫
npm run db:generate     # 產生 Prisma Client
npm run db:push         # 推送 schema 到資料庫
npm run db:migrate      # 執行遷移
npm run db:studio       # 開啟 Prisma Studio
npm run db:seed         # 填充測試資料

# Docker
npm run docker:up       # 啟動資料庫
npm run docker:down     # 停止資料庫
npm run docker:logs     # 查看日誌

# 建置
npm run build           # 建置生產版本
npm run start           # 啟動生產伺服器
npm run lint            # 執行 ESLint
```

## 資料庫 Schema

### User (使用者)
- `id` - 唯一識別碼
- `userId` - 使用者自訂 ID (4-20 字元)
- `name` - 姓名
- `email` - 電子郵件
- `image` - 頭像 URL
- `bio` - 簡介

### Post (貼文)
- `id` - 唯一識別碼
- `content` - 內容 (最多 280 字元)
- `authorId` - 作者 ID
- `createdAt` - 建立時間
- `updatedAt` - 更新時間

### Like (按讚)
- `id` - 唯一識別碼
- `postId` - 貼文 ID
- `userId` - 使用者 ID
- `createdAt` - 建立時間

### Comment (留言)
- `id` - 唯一識別碼
- `content` - 內容 (最多 280 字元)
- `postId` - 貼文 ID
- `authorId` - 作者 ID
- `createdAt` - 建立時間
- `updatedAt` - 更新時間

## API 端點

### 貼文 (Posts)
- `GET /api/posts` - 取得貼文列表
- `POST /api/posts` - 建立新貼文
- `GET /api/posts/[id]` - 取得單一貼文
- `PUT /api/posts/[id]` - 更新貼文
- `DELETE /api/posts/[id]` - 刪除貼文
- `POST /api/posts/[id]/like` - 按讚/取消按讚

### 留言 (Comments)
- `GET /api/posts/[id]/comments` - 取得貼文的留言
- `POST /api/posts/[id]/comments` - 新增留言
- `DELETE /api/comments/[id]` - 刪除留言

### 使用者 (Users)
- `GET /api/users/[userId]` - 取得使用者資料
- `GET /api/users/[userId]/posts` - 取得使用者的貼文

### 認證 (Auth)
- `GET /api/auth/[...nextauth]` - NextAuth 處理端點

## 認證流程

1. 使用者點擊 OAuth 登入按鈕
2. NextAuth 處理 OAuth 流程
3. 首次登入需要設定 `userId`
4. Session 持久化 30 天

## 特色功能

✅ 多種 OAuth 登入方式 (Google/GitHub/Facebook)
✅ 貼文發佈、編輯、刪除
✅ 按讚功能
✅ 留言功能
✅ 使用者個人頁面
✅ 深色/淺色主題切換
✅ Schema 驗證 (Zod)
✅ 分層架構設計
✅ TypeScript 類型安全
✅ Responsive 設計

## 待實現功能

- [ ] 轉發 (Retweet)
- [ ] 追蹤/粉絲系統
- [ ] 即時通知
- [ ] 媒體上傳
- [ ] 標籤 (Hashtags)
- [ ] 搜尋功能
- [ ] 私訊系統

## 專案結構詳細說明

### 驗證層 (Schemas)
所有前端和後端共用的 Zod schemas 定義在 `src/schemas/`：
- `user.schema.ts` - 使用者相關驗證
- `post.schema.ts` - 貼文相關驗證
- `comment.schema.ts` - 留言相關驗證

### 資料存取層 (Repositories)
負責資料庫操作：
- `userRepository.ts`
- `postRepository.ts`
- `likeRepository.ts`
- `commentRepository.ts`

### 業務邏輯層 (Services)
處理業務邏輯和資料處理：
- `userService.ts`
- `postService.ts`
- `likeService.ts`
- `commentRepository.ts`

### 控制器層 (Controllers)
驗證輸入、呼叫 Service、處理錯誤：
- `userController.ts`
- `postController.ts`
- `likeController.ts`
- `commentController.ts`

## 貢獻

歡迎提交 Issue 或 Pull Request！

## 授權

MIT License
