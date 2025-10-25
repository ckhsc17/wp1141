# 尋寶遊戲地圖 - API 設計文件

## 專案概述
一個基於地圖的尋寶遊戲應用，使用者可以在地圖上發佈和發現各種類型的「寶藏」。

## 技術架構
- **前端**: Next.js + TypeScript + Mantine UI + Google Maps API
- **後端**: Node.js + Express + TypeScript
- **資料庫**: PostgreSQL + Prisma ORM
- **認證**: OAuth (Google)

## 資料模型設計

### 1. User (使用者)
```typescript
interface User {
  id: string
  email: string
  name: string
  avatar?: string
  googleId: string
  createdAt: Date
  updatedAt: Date
}
```

### 2. Treasure (寶藏)
```typescript
interface Treasure {
  id: string
  userId: string
  title: string
  content: string
  type: TreasureType
  latitude: number
  longitude: number
  address?: string
  mediaUrl?: string // 音樂、錄音檔的 URL
  linkUrl?: string // 連結類型的 URL
  isLiveLocation: boolean // 是否為「活在當下」類型
  locationRadius: number // 位置半徑（公尺）
  tags: string[]
  likesCount: number
  commentsCount: number
  createdAt: Date
  updatedAt: Date
  user: User
  likes: Like[]
  comments: Comment[]
  favorites: Favorite[]
}

enum TreasureType {
  MUSIC = 'music'
  AUDIO = 'audio'
  TEXT = 'text'
  LINK = 'link'
  LIVE_MOMENT = 'live_moment'
}
```

### 3. Like (按讚)
```typescript
interface Like {
  id: string
  userId: string
  treasureId: string
  createdAt: Date
  user: User
  treasure: Treasure
}
```

### 4. Comment (留言)
```typescript
interface Comment {
  id: string
  userId: string
  treasureId: string
  content: string
  createdAt: Date
  updatedAt: Date
  user: User
  treasure: Treasure
}
```

### 5. Favorite (收藏)
```typescript
interface Favorite {
  id: string
  userId: string
  treasureId: string
  createdAt: Date
  user: User
  treasure: Treasure
}
```

### 6. Collect (收集)
```typescript
interface Collect {
  id: string
  userId: string
  treasureId: string
  createdAt: Date
  isLocked: boolean // 是否鎖定（無法查看）
  user: User
  treasure: Treasure
}
```

## DTO 設計

### Auth DTOs
```typescript
// 登入請求
interface LoginRequest {
  googleToken: string
}

// 登入回應
interface LoginResponse {
  user: UserDTO
  accessToken: string
  refreshToken: string
}

// 使用者 DTO
interface UserDTO {
  id: string
  email: string
  name: string
  avatar?: string
}
```

### Treasure DTOs
```typescript
// 創建寶藏請求
interface CreateTreasureRequest {
  title: string
  content: string
  type: TreasureType
  latitude: number
  longitude: number
  address?: string
  mediaFile?: File // 音樂、錄音檔
  linkUrl?: string
  tags: string[]
  isLiveLocation?: boolean
}

// 更新寶藏請求
interface UpdateTreasureRequest {
  title?: string
  content?: string
  tags?: string[]
  linkUrl?: string
}

// 寶藏列表查詢
interface TreasureQuery {
  latitude?: number
  longitude?: number
  radius?: number // 搜尋半徑（公里）
  type?: TreasureType
  tags?: string[]
  userId?: string
  page?: number
  limit?: number
}

// 寶藏 DTO
interface TreasureDTO {
  id: string
  title: string
  content: string
  type: TreasureType
  latitude: number
  longitude: number
  address?: string
  mediaUrl?: string
  linkUrl?: string
  isLiveLocation: boolean
  tags: string[]
  likesCount: number
  commentsCount: number
  isLiked: boolean // 當前使用者是否已按讚
  isFavorited: boolean // 當前使用者是否已收藏
  isCollected?: boolean // 當前使用者是否已收集（僅對寶藏類型有效）
  createdAt: string
  user: UserDTO
}

// 寶藏詳細資訊 DTO
interface TreasureDetailDTO extends TreasureDTO {
  comments: CommentDTO[]
}
```

### Comment DTOs
```typescript
// 創建留言請求
interface CreateCommentRequest {
  content: string
}

// 留言 DTO
interface CommentDTO {
  id: string
  content: string
  createdAt: string
  user: UserDTO
}
```

### Collect DTOs
```typescript
// 收集寶藏請求
interface CollectTreasureRequest {
  treasureId: string
}

// 收集 DTO
interface CollectDTO {
  id: string
  treasureId: string
  createdAt: string
  isLocked: boolean
  treasure: TreasureDTO
}
```

## API 端點設計

### 認證相關
```
POST   /api/auth/login          # Google OAuth 登入
POST   /api/auth/refresh        # 刷新 token
POST   /api/auth/logout         # 登出
GET    /api/auth/me             # 取得當前使用者資訊
```

### 寶藏相關
```
GET    /api/treasures           # 取得寶藏列表（支援地理位置和篩選）
POST   /api/treasures           # 創建新寶藏
GET    /api/treasures/:id       # 取得特定寶藏詳情
PUT    /api/treasures/:id       # 更新寶藏
DELETE /api/treasures/:id       # 刪除寶藏
POST   /api/treasures/:id/like  # 按讚/取消按讚
POST   /api/treasures/:id/favorite # 收藏/取消收藏
POST   /api/treasures/collect   # 收集寶藏/取消收集
```

### 留言相關
```
GET    /api/treasures/:id/comments    # 取得寶藏留言
POST   /api/treasures/:id/comments    # 新增留言
PUT    /api/comments/:id              # 更新留言
DELETE /api/comments/:id              # 刪除留言
```

### 用戶相關
```
GET    /api/users/profile             # 取得當前用戶資料
PUT    /api/users/profile             # 更新用戶資料
GET    /api/users/stats               # 取得用戶統計資料
GET    /api/users/treasures           # 取得用戶的寶藏列表
GET    /api/users/favorites           # 取得用戶的收藏列表
GET    /api/users/collects            # 取得用戶的收集寶藏列表
```

### 檔案上傳
```
POST   /api/upload                    # 上傳媒體檔案
```

### 地理位置相關
```
GET    /api/geocoding/reverse         # 反向地理編碼（經緯度轉地址）
```

### 前端 Google Places API 整合

搜尋功能直接使用前端的 Google Places API，無需後端代理。

**實現方式：**
- 前端直接呼叫 `google.maps.places.PlacesService.textSearch()`
- 支援地點名稱搜尋和位置偏差
- 搜尋結果與寶藏搜尋結果合併顯示

**PlaceSearchResult 介面：**
```typescript
interface PlaceSearchResult {
  name: string;           // 地點名稱
  address: string;        // 格式化地址
  latitude: number;       // 緯度
  longitude: number;      // 經度
  placeId: string;        // Google Places ID
}
```

## 回應格式

### 成功回應
```typescript
interface ApiResponse<T> {
  success: true
  data: T
  message?: string
}
```

### 錯誤回應
```typescript
interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}
```

### 分頁回應
```typescript
interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

## 寶藏類型圖標設計

| 類型 | 圖標 | 顏色 | 描述 |
|------|------|------|------|
| 音樂 | 🎵 | #FF6B6B | 音樂相關內容 |
| 錄音檔 | 🎙️ | #4ECDC4 | 語音、錄音內容 |
| 文字 | 📝 | #45B7D1 | 故事、詩、笑話等文字內容 |
| 連結 | 🔗 | #96CEB4 | 外部連結分享 |
| 活在當下 | 📍 | #FFEAA7 | 即時位置標記（20公尺範圍） |

## 地圖功能需求

1. **地圖顯示**: 使用 Google Maps 顯示寶藏位置
2. **位置權限**: 取得使用者當前位置
3. **地理編碼**: 經緯度與地址互轉
4. **範圍搜尋**: 指定半徑內的寶藏查詢
5. **即時定位**: 「活在當下」功能需驗證使用者實際位置

## 安全性考量

1. **認證**: JWT token 機制
2. **權限**: 使用者只能編輯自己的寶藏
3. **檔案上傳**: 限制檔案類型和大小
4. **位置驗證**: 「活在當下」類型需驗證使用者實際位置
5. **速率限制**: API 呼叫頻率限制

## 媒體上傳功能

### 支援的媒體類型

1. **圖片類型**:
   - 支援格式: JPG, PNG
   - 最大檔案大小: 10MB
   - 適用於: `IMAGE` 和 `LIVE_MOMENT` 寶藏類型

2. **音檔類型**:
   - 支援格式: MP3, WAV
   - 最大檔案大小: 10MB
   - 適用於: `AUDIO` 寶藏類型

### 媒體上傳 API

#### 1. 上傳圖片
```
POST /api/media/upload/image
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- image: File (JPG/PNG, max 10MB)

Response:
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/da1mls4nt/image/upload/v1234567890/treasures/abc123.jpg",
    "publicId": "treasures/abc123",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 1024000
  },
  "message": "圖片上傳成功"
}
```

#### 2. 上傳音檔
```
POST /api/media/upload/audio
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- audio: File (MP3/WAV, max 10MB)

Response:
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/da1mls4nt/video/upload/v1234567890/treasures/audio123.mp3",
    "publicId": "treasures/audio123",
    "format": "mp3",
    "bytes": 2048080
  },
  "message": "音檔上傳成功"
}
```

#### 3. 刪除媒體
```
DELETE /api/media/delete/{publicId}?resourceType=image
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "媒體刪除成功"
}
```

### 前端整合

1. **TreasureForm 組件**:
   - 根據寶藏類型顯示對應的檔案上傳 UI
   - 即時上傳並顯示預覽
   - 支援檔案驗證和錯誤處理

2. **TreasureCard 組件**:
   - 圖片: 顯示縮圖，點擊放大查看
   - 音檔: 內嵌 HTML5 audio 播放器
   - 響應式佈局支援

3. **Cloudinary 整合**:
   - 自動圖片優化和格式轉換
   - CDN 加速載入
   - 安全檔案儲存

## 開發順序

1. **第一階段**: 前端基礎架構和地圖整合
2. **第二階段**: 後端 API 和資料庫設計
3. **第三階段**: 認證系統整合
4. **第四階段**: 檔案上傳和媒體處理
5. **第五階段**: 測試和優化