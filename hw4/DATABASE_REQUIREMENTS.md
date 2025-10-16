# 資料庫需求分析文件

## 概述
尋寶地圖應用需要一個關聯式資料庫來儲存使用者、寶藏、互動記錄等資料。本文件詳細描述資料庫的需求、設計原則和實作方案。

## 資料庫設計原則

### 1. 資料一致性
- 使用外鍵約束確保資料完整性
- 避免資料冗餘和不一致
- 實作適當的級聯刪除策略

### 2. 效能考量
- 為經常查詢的欄位建立索引
- 優化地理位置查詢效能
- 考慮讀寫分離和快取策略

### 3. 可擴展性
- 使用 UUID 作為主鍵避免分散式問題
- 設計支援水平擴展的資料結構
- 考慮未來功能擴展的需求

## 核心實體分析

### 1. User (使用者)
**用途**: 儲存使用者基本資料和認證資訊

**欄位需求**:
- `id`: 唯一識別碼 (UUID)
- `email`: 電子郵件，用於登入和通知
- `name`: 顯示名稱
- `avatar`: 頭像 URL (可選)
- `googleId`: Google OAuth 唯一識別碼
- `createdAt/updatedAt`: 時間戳記

**業務規則**:
- email 必須唯一
- googleId 必須唯一
- 刪除使用者時需要處理相關資料

### 2. Treasure (寶藏)
**用途**: 儲存寶藏的基本資訊和地理位置

**欄位需求**:
- `id`: 唯一識別碼 (UUID)
- `userId`: 創建者外鍵
- `title`: 寶藏標題 (1-100字)
- `content`: 寶藏描述 (1-1000字)
- `type`: 寶藏類型枚舉
- `latitude/longitude`: 經緯度座標
- `address`: 地址文字 (可選)
- `mediaUrl`: 媒體檔案 URL (可選)
- `linkUrl`: 外部連結 URL (可選)
- `isLiveLocation`: 是否為即時位置標記
- `locationRadius`: 位置半徑 (預設20公尺)
- `tags`: 標籤陣列
- `likesCount/commentsCount`: 統計計數器
- `createdAt/updatedAt`: 時間戳記

**業務規則**:
- title 和 content 不能為空
- 地理座標必須在有效範圍內
- 不同類型的寶藏有不同的必填欄位
- 刪除寶藏時需要級聯刪除相關互動記錄

### 3. Like (按讚)
**用途**: 記錄使用者對寶藏的按讚行為

**欄位需求**:
- `id`: 唯一識別碼 (UUID)
- `userId`: 按讚使用者外鍵
- `treasureId`: 被按讚寶藏外鍵
- `createdAt`: 按讚時間

**業務規則**:
- 同一使用者對同一寶藏只能按讚一次
- 複合唯一約束 (userId, treasureId)
- 刪除時需要更新寶藏的按讚計數

### 4. Comment (留言)
**用途**: 儲存使用者對寶藏的留言

**欄位需求**:
- `id`: 唯一識別碼 (UUID)
- `userId`: 留言使用者外鍵
- `treasureId`: 留言寶藏外鍵
- `content`: 留言內容 (1-500字)
- `createdAt/updatedAt`: 時間戳記

**業務規則**:
- content 不能為空
- 刪除時需要更新寶藏的留言計數
- 支援留言的編輯和刪除

### 5. Favorite (收藏)
**用途**: 記錄使用者對寶藏的收藏行為

**欄位需求**:
- `id`: 唯一識別碼 (UUID)
- `userId`: 收藏使用者外鍵
- `treasureId`: 被收藏寶藏外鍵
- `createdAt`: 收藏時間

**業務規則**:
- 同一使用者對同一寶藏只能收藏一次
- 複合唯一約束 (userId, treasureId)

## 索引策略

### 1. 主要索引
- 所有表的主鍵自動建立索引
- 外鍵約束自動建立索引

### 2. 地理位置索引
```sql
-- 為地理位置查詢建立空間索引
CREATE INDEX idx_treasures_location ON treasures USING GIST (
  ST_Point(longitude, latitude)
);
```

### 3. 查詢優化索引
```sql
-- 使用者寶藏查詢
CREATE INDEX idx_treasures_user_created ON treasures (userId, createdAt DESC);

-- 地理範圍查詢
CREATE INDEX idx_treasures_lat_lng ON treasures (latitude, longitude);

-- 寶藏類型查詢
CREATE INDEX idx_treasures_type_created ON treasures (type, createdAt DESC);

-- 標籤搜尋
CREATE INDEX idx_treasures_tags ON treasures USING GIN (tags);
```

## 資料庫設計考量

### 1. 正規化
- 第三正規化 (3NF) 設計
- 避免資料重複和更新異常
- 適當的反正規化以提升查詢效能

### 2. 資料完整性
- 外鍵約束確保關聯完整性
- 檢查約束驗證資料格式
- 非空約束防止無效資料

### 3. 擴展性設計
- 預留未來功能的欄位空間
- 使用 JSONB 儲存靈活的標籤資料
- 支援資料庫分片的設計

### 4. 安全性
- 敏感資料加密儲存
- 存取權限控制
- 審計日誌記錄

## 效能優化策略

### 1. 查詢優化
- 地理位置查詢使用空間索引
- 分頁查詢使用 OFFSET/LIMIT
- 避免 N+1 查詢問題

### 2. 快取策略
- 應用層快取熱門寶藏
- Redis 快取使用者會話
- CDN 快取靜態檔案

### 3. 資料庫調優
- 連接池配置優化
- 查詢計劃分析和優化
- 定期統計資料更新

## 備份與恢復策略

### 1. 備份策略
- 每日完整備份
- 實時 WAL (Write-Ahead Logging) 備份
- 跨區域備份儲存

### 2. 災難恢復
- RTO (Recovery Time Objective): 4小時
- RPO (Recovery Point Objective): 1小時
- 定期恢復測試

## 資料遷移策略

### 1. 版本控制
- 使用 Prisma Migration 管理資料庫版本
- 向前向後兼容的遷移腳本
- 生產環境遷移的安全檢查

### 2. 滾動更新
- 零停機時間部署
- 漸進式資料遷移
- 回滾機制

## 監控與維護

### 1. 效能監控
- 查詢執行時間監控
- 慢查詢日誌分析
- 資源使用率監控

### 2. 資料品質
- 資料完整性檢查
- 孤立記錄清理
- 統計資料更新

## 總結

本資料庫設計滿足尋寶地圖應用的所有核心需求，包括：
- 使用者管理和認證
- 寶藏資料儲存和地理位置查詢
- 社交互動功能 (按讚、留言、收藏)
- 效能優化和可擴展性
- 資料安全和備份恢復

設計遵循最佳實務，確保系統的可靠性、效能和可維護性。