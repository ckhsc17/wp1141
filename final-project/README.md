# MeetHalf - 聚會即時定位追蹤

> 讓每次聚會都不再等待，即時掌握大家位置，記錄誰準時誰遲到

網站連結：https://meet-half.vercel.app
Public rep (with commit history): https://github.com/MeetHalf/MeetHalf

## 專案簡介

MeetHalf 是一個**聚會即時定位追蹤應用**，解決朋友聚會時「不知道大家到哪了」、「誰又遲到了」的問題。

本應用主要在手機上使用，並且有完整支援 **PWA (Progressive Web App)** 功能，增加主動性及黏著度：

- 📱 **安裝到主畫面**：首次打開時點擊「分享」-「加入主畫面」
  - Safari：分享按鈕在下方正中間
  - Chrome：分享按鈕在右上角（三個點）
- 🔔 **推播通知**：PWA 模式下支援本地推播通知（Pusher Beams）
- 🔗 **邀請碼功能**：PWA 安裝後可使用邀請碼快速加入活動
- ⚡ **離線支援**：Service Worker 提供基本離線功能

本專案使用 GitHub Issues 來追蹤進度

### 核心功能

**📍 即時定位追蹤**
- 集合前後 30 分鐘自動追蹤成員位置
- 即時地圖顯示所有人的位置
- Pusher 推送，位置更新零延遲

**👥 Guest 模式**
- 無需註冊，填暱稱就能加入
- 一鍵分享連結邀請朋友

**⏰ 到達記錄**
- 點擊「我到了」標記到達時間
- 自動計算準時/遲到
- 戳遲到的朋友（限制 3 次）

**🏆 聚會結束排行榜**
- 金銀銅牌前三名
- 遲到統計與被戳排名
- 儲存歷史記錄

**👨‍👩‍👧‍👦 好友與聊天系統** ✨ 新功能
- 搜尋並加入好友
- 個人與群組即時聊天
- 好友邀請通知
- 聊天訊息推播通知

**🔔 通知中心** ✨ 新功能
- 統一管理所有通知（好友邀請、訊息、活動邀請、戳人）
- 即時推送與推播通知
- 通知內直接操作（接受/拒絕好友邀請）

### 可選功能

**🗺️ MeetHalf 智能中點計算**（選用）
- 建立聚會時可選擇用 MeetHalf 找中間點
- 考慮交通時間計算最公平的會面點
- 支援多種交通方式

---

## 🚀 快速開始

### 前置需求

- Node.js 18+
- Google Maps API Key
- Pusher Account（免費方案即可）

### 1. Clone 專案

```bash
git clone https://github.com/MeetHalf/MeetHalf.git
cd MeetHalf
```

### 2. 後端設定

```bash
cd backend
npm install
cp .env.example .env
# 編輯 .env 填入：
# - JWT_SECRET
# - DATABASE_URL
# - PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER

npm run prisma:migrate
npm run dev  # Port 3000
```

### 3. 前端設定

```bash
cd frontend
npm install
cp .env.example .env
# 編輯 .env 填入：
# - VITE_GOOGLE_MAPS_JS_KEY
# - VITE_PUSHER_KEY
# - VITE_PUSHER_CLUSTER

npm run dev  # Port 5173
```

### 4. 訪問應用

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/healthz

---

## 📖 使用者流程

### 主揪（Organizer）

1. **建立聚會**
   - 填寫名稱、時間
   - 選擇地點（直接選 / 用 MeetHalf 計算）
   - 取得分享連結

2. **分享連結**
   - 取得分享連結 (`/invite/:token`) 或邀請碼
   - 貼到 Line / Messenger / IG
   - 朋友點開連結或輸入邀請碼就能加入
   - 支援 PWA 安裝後使用邀請碼

3. **活動當下**
   - 查看成員即時位置
   - 看誰已到達、誰遲到

4. **活動結束**
   - 查看排行榜
   - 保存到歷史記錄

### 參加者（Participant）

1. **打開連結或輸入邀請碼**
   - 收到邀請連結 (`/invite/:token`) 或邀請碼
   - 看到聚會資訊（時間、地點、地圖）
   - 點擊「加入聚會」

2. **Guest 加入**
   - 填寫暱稱
   - 選擇是否分享位置
   - 選擇交通方式（用於 MeetHalf 計算）

3. **定位分享**
   - 同意後開始追蹤位置（僅時間窗內：集合前後 30 分鐘）
   - 地圖上看到其他人的位置
   - 即時更新（Pusher 推送）

4. **到達標記**
   - 到了點擊「我到了」
   - 或自動判斷（距離 < 50m）
   - 自動計算準時/遲到

5. **互動**
   - 戳遲到的朋友（限制 3 次）
   - 查看排行榜
   - 接收推播通知

---

## 🏗️ 技術架構

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Material-UI (MUI v7) + Framer Motion (動畫)
- **資料管理**: React Query (TanStack Query) - 自動快取、樂觀更新、後台重新驗證
- **表單處理**: React Hook Form + Zod
- **地圖**: Google Maps JavaScript API
- **即時通訊**: Pusher Channels
- **推播通知**: Pusher Beams (Web Push + Service Worker)
- **路由**: React Router v6
- **HTTP**: Axios
- **日期處理**: date-fns + MUI X Date Pickers
- **PWA**: Service Worker + Web App Manifest
- **測試**: Vitest + React Testing Library

### Backend
- **Framework**: Node.js + Express + TypeScript
- **資料庫**: PostgreSQL + Prisma ORM
- **快取**: LRU Cache (記憶體快取，適用於 serverless 環境)
- **認證**: JWT (HttpOnly Cookie) + Guest Token + OAuth (Google/GitHub)
- **即時通訊**: Pusher Channels
- **推播通知**: Pusher Beams (Web Push)
- **APIs**: Google Maps (Geocoding, Places, Directions, Distance Matrix)
- **安全**: Helmet, CORS, bcrypt (10 rounds), Rate Limiting
- **驗證**: Zod (所有 API payload)
- **API 文件**: Swagger UI (`/api-docs`)
- **測試**: Vitest

### 資料庫 Schema

```prisma
model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  groups       Group[]
  members      Member[]
}

model Event {
  id              String   @id @default(cuid())
  title           String
  datetime        DateTime
  meetingPointLat Float
  meetingPointLng Float
  meetingPointName String
  timeWindowBefore Int    @default(30)
  timeWindowAfter  Int    @default(30)
  useMeetHalf     Boolean @default(false)
  ownerId         Int
  status          String   @default("upcoming")
  members         EventMember[]
  createdAt       DateTime @default(now())
}

model EventMember {
  id              String   @id @default(cuid())
  eventId         String
  userId          Int?
  guestId         String?
  nickname        String
  isGuest         Boolean  @default(false)
  shareLocation   Boolean  @default(false)
  currentLat      Float?
  currentLng      Float?
  arrivalTime     DateTime?
  travelMode      String   @default("transit")
}
```

---

## 📂 專案結構

```
MeetHalf/
├── backend/
│   ├── src/
│   │   ├── routes/              # API 路由
│   │   │   ├── auth.ts          # 認證 API (Google/GitHub OAuth)
│   │   │   ├── events.ts         # 活動管理 API
│   │   │   ├── groups.ts         # 群組管理 API
│   │   │   ├── members.ts        # 成員管理 API
│   │   │   ├── maps.ts           # Google Maps API 代理
│   │   │   ├── chat.ts           # 聊天訊息 API
│   │   │   ├── friends.ts        # 好友管理 API
│   │   │   ├── notifications.ts  # 通知 API
│   │   │   ├── users.ts          # 用戶資料與統計 API
│   │   │   ├── invite.ts         # 邀請連結解析 API
│   │   │   ├── eventInvitations.ts  # 活動邀請 API
│   │   │   └── cron.ts           # 定時任務 API
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT 驗證中間件
│   │   │   └── rateLimit.ts      # 速率限制中間件
│   │   ├── services/             # 業務邏輯層
│   │   │   ├── ChatService.ts
│   │   │   ├── EventService.ts
│   │   │   ├── FriendService.ts
│   │   │   ├── MemberService.ts
│   │   │   ├── NotificationService.ts
│   │   │   ├── PokeService.ts
│   │   │   ├── ETAService.ts
│   │   │   ├── StatsService.ts
│   │   │   └── ShareTokenService.ts
│   │   ├── repositories/         # 資料存取層
│   │   │   ├── ChatRepository.ts
│   │   │   ├── EventRepository.ts
│   │   │   ├── FriendRepository.ts
│   │   │   ├── GroupRepository.ts
│   │   │   ├── MemberRepository.ts
│   │   │   ├── NotificationRepository.ts
│   │   │   ├── PokeRecordRepository.ts
│   │   │   └── UserRepository.ts
│   │   ├── schemas/              # Zod 驗證 Schema
│   │   │   ├── chat.ts
│   │   │   ├── events.ts
│   │   │   ├── friends.ts
│   │   │   ├── groups.ts
│   │   │   ├── members.ts
│   │   │   ├── notifications.ts
│   │   │   └── users.ts
│   │   ├── lib/                  # 工具庫
│   │   │   ├── prisma.ts         # Prisma 客戶端
│   │   │   ├── pusher.ts         # Pusher Channels
│   │   │   ├── pusherBeams.ts    # Pusher Beams (推播)
│   │   │   ├── gmaps.ts          # Google Maps 客戶端
│   │   │   ├── cache.ts          # LRU 快取
│   │   │   ├── logger.ts         # 日誌工具
│   │   │   └── userUtils.ts      # 用戶工具函數
│   │   ├── config/               # 配置檔案
│   │   │   ├── swagger.ts        # Swagger API 文檔配置
│   │   │   └── eta.ts            # ETA 計算配置
│   │   ├── utils/                # 工具函數
│   │   │   └── jwt.ts            # JWT 工具
│   │   └── index.ts              # Express 應用入口
│   └── prisma/
│       └── schema.prisma         # Prisma Schema
│
├── frontend/
│   ├── src/
│   │   ├── pages/                # 頁面元件
│   │   │   ├── Events.tsx        # 活動列表
│   │   │   ├── EventRoom.tsx     # 活動房間
│   │   │   ├── EventDetail.tsx   # 活動詳情
│   │   │   ├── CreateEvent.tsx   # 建立活動
│   │   │   ├── ChatRoom.tsx      # 聊天室
│   │   │   ├── Friends.tsx       # 好友列表
│   │   │   ├── Notifications.tsx # 通知中心
│   │   │   ├── Profile.tsx       # 個人資料
│   │   │   ├── Login.tsx         # 登入頁
│   │   │   ├── FirstTimeSetup.tsx # 首次設定
│   │   │   └── InvitePage.tsx    # 邀請頁
│   │   ├── components/           # 共用元件
│   │   │   ├── EventCard.tsx     # 活動卡片
│   │   │   ├── EventResultPopup.tsx  # 活動結果彈窗
│   │   │   ├── MapContainer.tsx  # 地圖容器
│   │   │   ├── RouteInfoPanel.tsx # 路線資訊面板
│   │   │   ├── ChatPopup.tsx     # 聊天彈窗
│   │   │   ├── ConversationItem.tsx # 對話項目
│   │   │   ├── FriendListDialog.tsx # 好友列表對話框
│   │   │   ├── CreateGroupDialog.tsx # 建立群組對話框
│   │   │   ├── AddFriendDrawer.tsx   # 新增好友抽屜
│   │   │   ├── Navbar.tsx        # 導航欄
│   │   │   ├── BottomNav.tsx     # 底部導航
│   │   │   ├── TabBar.tsx        # 標籤欄
│   │   │   └── Layout.tsx        # 佈局元件
│   │   ├── hooks/                # 自訂 Hooks
│   │   │   ├── useAuth.ts        # 認證 Hook
│   │   │   ├── useChat.ts        # 聊天 Hook (React Query)
│   │   │   ├── useFriends.ts     # 好友 Hook (React Query)
│   │   │   ├── usePusher.ts      # Pusher Hook
│   │   │   ├── useNotifications.ts # 通知 Hook
│   │   │   ├── useLocationTracking.ts # 位置追蹤 Hook
│   │   │   └── useEventProgress.ts # 活動進度 Hook
│   │   ├── api/                  # API 客戶端
│   │   │   ├── axios.ts          # Axios 實例
│   │   │   ├── events.ts
│   │   │   ├── chat.ts
│   │   │   ├── friends.ts
│   │   │   ├── groups.ts
│   │   │   ├── notifications.ts
│   │   │   ├── users.ts
│   │   │   └── eventInvitations.ts
│   │   ├── lib/                  # 工具庫
│   │   │   ├── queryClient.ts    # React Query 客戶端
│   │   │   ├── googleMapsLoader.ts # Google Maps 載入器
│   │   │   ├── pusherBeams.ts    # Pusher Beams 設定
│   │   │   └── notifications.ts  # 通知工具
│   │   ├── types/                # TypeScript 型別定義
│   │   │   ├── events.ts
│   │   │   ├── chat.ts
│   │   │   ├── friend.ts
│   │   │   ├── notification.ts
│   │   │   └── eventInvitation.ts
│   │   ├── theme/                # Material-UI 主題
│   │   │   └── index.ts
│   │   ├── router.tsx            # React Router 配置
│   │   └── App.tsx               # 應用根元件
│   └── ...
│
├── EVENTS_API_SPEC.md            # Events API 完整規格
├── NOTIFICATIONS_API_SPEC.md     # Notifications API 規格
├── COLLABORATION.md              # 協作開發指南
└── README.md
```

---

## 🎬 開發階段

### Stage 0-2: 核心功能 ✅ 已完成

- ✅ Events API 完整實作
- ✅ 邀請連結系統 (Share Token)
- ✅ Guest 模式加入
- ✅ 即時定位追蹤 (Pusher)
- ✅ 到達標記與排行榜
- ✅ 戳人功能
- ✅ 活動邀請系統
- ✅ 我的聚會列表
- ✅ 個人統計

### Stage 2: MeetHalf 整合 ✅ 已完成

- ✅ 建立 Event 時可選擇「用 MeetHalf 找中間點」
- ✅ 主揪與好友填寫出發地與交通方式
- ✅ 智能中點計算（考慮交通時間）
- ✅ 推薦地點列表（Google Places API）
- ✅ 臨時中點計算（建立活動前預覽）

### Stage 3: 好友與聊天系統 ✅ 已完成

- ✅ 好友管理（搜尋、邀請、接受/拒絕、刪除）
- ✅ 個人與群組即時聊天
- ✅ 通知中心（統一管理所有通知）
- ✅ 推播通知（Pusher Beams）
- ✅ 底部 Tab Bar 導航（活動、好友、個人）
- ✅ 已讀回條與未讀數量

### Stage 3.5: 效能優化 ✅ 已完成

- ✅ React Query 整合（前端自動快取與樂觀更新）
  - 聊天訊息樂觀更新，立即顯示不等待伺服器
  - 自動快取減少 API 呼叫
  - 與 Pusher 即時更新完美整合
- ✅ 資料庫查詢優化
  - 解決 Events 頁面 N+1 查詢問題
  - 優化 Conversations 查詢（批量計算未讀數）
  - 使用 Prisma 事務確保資料一致性
- ✅ 後端快取策略
  - LRU Cache 記憶體快取（適用 Web 和 PWA）
  - 事件列表和對話列表快取
  - 自動失效機制
- ✅ 批量操作優化
  - 批量建立通知和邀請
  - 並行處理推送通知
- ✅ 生產環境優化
  - 日誌輸出控制（開發/生產環境分離）
  - Swagger UI CSP 修復

### Stage 4: 進階功能 💡 未來規劃

- ✅ PWA 支援（Service Worker、Web App Manifest、桌面安裝）
- ⏳ 離線快取策略優化
- ⏳ 聚會模板
- ⏳ 統計圖表（視覺化）
- ⏳ 匯出報表
- ⏳ 多語言支援 (i18n)

---

## 🔧 API 文件

### Events API

完整規格請見 [EVENTS_API_SPEC.md](./EVENTS_API_SPEC.md)

**主要端點**：
- `POST /events` - 建立聚會
- `GET /events/:id` - 取得聚會資訊
- `POST /events/:id/join` - Guest 加入
- `POST /events/:id/location` - 更新位置
- `POST /events/:id/arrival` - 標記到達
- `POST /events/:id/poke` - 戳人
- `GET /events/:id/result` - 取得排行榜
- `GET /events/my-events` - 我的聚會列表
- `GET /users/me/stats` - 個人統計

**Pusher 事件**：
- `location-update` - 位置更新
- `member-arrived` - 成員到達
- `poke` - 戳人通知
- `event-ended` - 聚會結束

### Friends API ✨ 新

完整規格請見 [FRIENDS_API_SPEC.md](./FRIENDS_API_SPEC.md) (待補充)

**主要端點**：
- `POST /friends/requests` - 發送好友邀請
- `GET /friends/requests` - 取得好友邀請
- `POST /friends/requests/:id/accept` - 接受邀請
- `POST /friends/requests/:id/reject` - 拒絕邀請
- `GET /friends` - 取得好友列表
- `DELETE /friends/:friendId` - 刪除好友
- `GET /friends/search` - 搜尋用戶

### Chat API ✨ 新

完整規格請見 [CHAT_API_SPEC.md](./CHAT_API_SPEC.md) (待補充)

**主要端點**：
- `POST /chat/messages` - 發送訊息
- `GET /chat/messages` - 取得聊天記錄
- `PUT /chat/messages/:id/read` - 標記已讀
- `GET /chat/conversations` - 取得聊天室列表
- `GET /chat/unread-count` - 取得未讀數量
- `GET /chat/search` - 搜尋訊息

**Pusher 頻道**：
- `chat-user-{userId}` - 個人聊天
- `group-{groupId}` - 群組聊天

### Notifications API ✨ 新

完整規格請見 [NOTIFICATIONS_API_SPEC.md](./NOTIFICATIONS_API_SPEC.md)

**主要端點**：
- `GET /notifications` - 取得通知列表
- `PUT /notifications/:id/read` - 標記已讀
- `PUT /notifications/read-all` - 全部標記已讀
- `DELETE /notifications/:id` - 刪除通知
- `GET /notifications/unread-count` - 取得未讀數量

**通知類型**：
- `FRIEND_REQUEST` - 好友邀請
- `FRIEND_ACCEPTED` - 好友邀請已接受
- `NEW_MESSAGE` - 新訊息
- `EVENT_INVITE` - 活動邀請
- `POKE` - 戳人通知
- `EVENT_UPDATE` - 活動更新

### MeetHalf API

- `POST /groups` - 建立群組
- `GET /groups/:id` - 取得群組
- `POST /members` - 加入成員
- `GET /groups/:id/midpoint_by_time` - 計算中點（群組模式）
- `POST /events/calculate-midpoint` - 計算臨時中點（建立活動前預覽）

### Invite API

- `GET /invite/:token` - 解析邀請 Token 取得 Event ID（公開端點）

---

## 🔑 環境變數設定

### 後端 `.env`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/meethalf"

# JWT
JWT_SECRET="your_super_secret_jwt_key_min_32_chars"

# Google Maps (Server Key)
GOOGLE_MAPS_API_KEY="your_google_maps_server_key"

# Pusher
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
PUSHER_CLUSTER="ap3"

# Pusher Beams (Push Notifications)
PUSHER_BEAMS_INSTANCE_ID="your_beams_instance_id"
PUSHER_BEAMS_SECRET_KEY="your_beams_secret_key"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Logging (optional)
# Set DEBUG=true to enable verbose logging in production
# DEBUG="true"
```

### 前端 `.env`

```env
# Google Maps (Browser Key)
VITE_GOOGLE_MAPS_JS_KEY="your_google_maps_browser_key"

# Pusher
VITE_PUSHER_KEY="your_pusher_key"
VITE_PUSHER_CLUSTER="ap3"

# Pusher Beams (Push Notifications)
VITE_PUSHER_BEAMS_INSTANCE_ID="your_beams_instance_id"

# Backend API (optional)
# VITE_API_BASE_URL="http://localhost:3000"
```

---

## 🧪 測試

### 後端測試

```bash
cd backend
npm run test              # 執行測試
npm run test:watch        # Watch 模式
npm run test:coverage     # 覆蓋率報告
```

### 前端測試

```bash
cd frontend
npm run test              # 執行測試
npm run test:ui           # UI 模式
```

---

## 🚢 部署

### Vercel (推薦)

**前端**:
```bash
cd frontend
vercel
```

**後端**:
```bash
cd backend
vercel
```

環境變數需在 Vercel Dashboard 設定。

### Docker

```bash
docker-compose up -d
```

---

## 🤝 協作開發

### 分支策略

- `main` - 生產環境
- `frontend-dev` - 前端開發主分支
- `backend-dev` - 後端開發主分支
- `feature/#X-description` - 功能分支

### Commit Message 規範

```
feat: 新功能
fix: Bug 修復
docs: 文件更新
chore: 環境設定
style: 程式碼格式
refactor: 重構
test: 測試
```

範例：
```bash
git commit -m "feat(events): add EventRoom page with real-time tracking"
git commit -m "fix(pusher): resolve connection timeout issue"
```

### 開發流程

1. 從 `frontend-dev` 或 `backend-dev` 分出 feature branch
2. 完成開發並測試
3. 提交 PR 到對應的 dev branch
4. Code review 後合併
5. 定期將 dev branch 合併到 main

詳見 [COLLABORATION.md](./COLLABORATION.md)

---

## 📝 授權

此專案為 Web Programming 課程 Final Project。

---

## 🙏 致謝

- [React](https://react.dev/)
- [Material-UI](https://mui.com/)
- [Pusher](https://pusher.com/)
- [Google Maps Platform](https://developers.google.com/maps)
- [Prisma](https://www.prisma.io/)

---

---

## 📊 技術架構圖

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web Browser]
        PWA[PWA App]
        Mobile[Mobile Browser]
    end
    
    subgraph "Frontend (React + TypeScript)"
        React[React 18 + Vite]
        MUI[Material-UI]
        Query[React Query]
        Maps[Google Maps JS API]
        PusherClient[Pusher Channels Client]
        BeamsClient[Pusher Beams Client]
        Router[React Router]
    end
    
    subgraph "Backend (Node.js + Express + TypeScript)"
        Express[Express Server]
        Auth[Auth Middleware<br/>JWT + OAuth]
        Routes[API Routes]
        Services[Business Logic Services]
        Repos[Data Repositories]
        Cache[LRU Cache]
    end
    
    subgraph "External Services"
        Pusher[Pusher Channels<br/>Real-time Events]
        Beams[Pusher Beams<br/>Push Notifications]
        GMaps[Google Maps APIs<br/>Geocoding/Places/Directions]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        PostgreSQL[(PostgreSQL Database)]
    end
    
    Web --> React
    PWA --> React
    Mobile --> React
    
    React --> MUI
    React --> Query
    React --> Maps
    React --> PusherClient
    React --> BeamsClient
    React --> Router
    
    PusherClient <--> Pusher
    BeamsClient <--> Beams
    Maps <--> GMaps
    
    Query --> Express
    Router --> Express
    
    Express --> Auth
    Express --> Routes
    Routes --> Services
    Services --> Repos
    Services --> Cache
    Repos --> Prisma
    Prisma --> PostgreSQL
    
    Services --> Pusher
    Services --> Beams
    Services --> GMaps
    
    style React fill:#4285f4
    style Express fill:#339933
    style PostgreSQL fill:#336791
    style Pusher fill:#300d4f
    style Beams fill:#300d4f
    style GMaps fill:#4285f4
```

---

## 🔄 使用流程圖

```mermaid
flowchart TD
    Start([使用者進入應用]) --> Auth{已登入?}
    
    Auth -->|否| Login[登入頁面<br/>Google/GitHub OAuth]
    Login --> FirstTime{首次使用?}
    FirstTime -->|是| Setup[首次設定<br/>設定預設位置/交通方式]
    FirstTime -->|否| EventsPage
    Setup --> EventsPage[活動列表頁面]
    Auth -->|是| EventsPage
    
    EventsPage --> CreateEvent[建立活動]
    EventsPage --> ViewEvent[查看活動]
    EventsPage --> InviteLink[收到邀請連結]
    
    CreateEvent --> EventType{選擇建立方式}
    EventType -->|直接指定地點| DirectLocation[填寫活動資訊<br/>名稱/時間/地點]
    EventType -->|使用 MeetHalf| MeetHalfFlow[選擇 MeetHalf 模式]
    
    MeetHalfFlow --> AddMembers[新增成員<br/>好友/假人]
    AddMembers --> SetDeparture[設定出發點<br/>主辦/好友/假人]
    SetDeparture --> Calculate[計算中點<br/>考慮交通時間]
    Calculate --> SelectPlace[選擇推薦地點]
    SelectPlace --> ConfirmEvent[確認活動資訊]
    
    DirectLocation --> ConfirmEvent
    ConfirmEvent --> GenerateToken[生成分享 Token]
    GenerateToken --> ShareDialog[顯示分享連結<br/>/invite/:token]
    
    InviteLink --> ResolveToken[解析 Token<br/>GET /invite/:token]
    ResolveToken --> EventDetail[活動詳情頁面]
    
    ShareDialog --> ShareMethod{分享方式}
    ShareMethod -->|複製連結| CopyLink[複製到剪貼簿]
    ShareMethod -->|Line/Messenger| SocialShare[社群分享]
    ShareMethod -->|PWA 邀請碼| PWACode[顯示邀請碼]
    
    EventDetail --> Join{加入方式}
    Join -->|已登入| AutoJoin[自動加入<br/>使用預設資訊]
    Join -->|Guest| GuestJoin[填寫暱稱<br/>選擇是否分享位置]
    
    AutoJoin --> EventRoom[活動房間]
    GuestJoin --> EventRoom
    
    EventRoom --> TimeCheck{時間窗內?}
    TimeCheck -->|否| Waiting[等待活動開始]
    TimeCheck -->|是| Tracking[開始位置追蹤]
    
    Waiting --> TimeCheck
    
    Tracking --> LocationUpdate[更新位置<br/>POST /events/:id/location]
    LocationUpdate --> PusherUpdate[Pusher 推送<br/>location-update]
    PusherUpdate --> MapUpdate[地圖即時更新]
    
    Tracking --> Arrival{到達?}
    Arrival -->|點擊我到了| MarkArrival[標記到達<br/>POST /events/:id/arrival]
    Arrival -->|自動判斷| AutoArrival[距離 < 50m<br/>自動標記]
    
    MarkArrival --> ArrivalPusher[Pusher 推送<br/>member-arrived]
    AutoArrival --> ArrivalPusher
    ArrivalPusher --> StatusUpdate[更新成員狀態]
    
    StatusUpdate --> Poke{有人遲到?}
    Poke -->|是| PokeAction[戳人功能<br/>POST /events/:id/poke<br/>限制 3 次]
    PokeAction --> PokePusher[Pusher 推送<br/>poke]
    PokePusher --> Notification[推播通知]
    
    Tracking --> EventEnd{活動結束?}
    EventEnd -->|是| EndPusher[Pusher 推送<br/>event-ended]
    EndPusher --> Result[顯示排行榜<br/>GET /events/:id/result]
    Result --> Stats[統計資訊<br/>準時/遲到/被戳]
    
    style Start fill:#e1f5ff
    style EventsPage fill:#fff4e1
    style EventRoom fill:#e8f5e9
    style Result fill:#f3e5f5
    style MeetHalfFlow fill:#fff9c4
    style Tracking fill:#e3f2fd
```

---

**Last Updated**: 2025-12-21  
**Status**: Stage 3.5 完成 (效能優化)  
**Team**: Frontend + Backend 協作開發
