# 開發計劃 - 尋寶遊戲地圖

## 專案架構概覽

```
hw4/
├── frontend/                 # Next.js + TypeScript + Mantine
│   ├── src/
│   │   ├── components/      # UI 組件
│   │   ├── contexts/        # React Context
│   │   ├── hooks/           # 自定義 Hooks
│   │   ├── pages/           # 頁面
│   │   ├── services/        # API 服務
│   │   ├── types/           # TypeScript 類型
│   │   └── utils/           # 工具函數
│   ├── public/              # 靜態資源
│   └── package.json
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/     # API 控制器
│   │   ├── services/        # 業務邏輯
│   │   ├── repositories/    # 資料訪問層
│   │   ├── middleware/      # 中間件
│   │   ├── types/           # TypeScript 類型
│   │   ├── utils/           # 工具函數
│   │   └── prisma/          # Prisma 配置
│   ├── uploads/             # 檔案上傳目錄
│   └── package.json
└── docs/                    # 文件
```

## 開發階段規劃

### 第一階段：前端基礎架構 (Day 1-2)

#### 1.1 專案初始化
- [x] 創建 Next.js TypeScript 專案
- [ ] 安裝必要套件 (Mantine UI, Google Maps)
- [ ] 設定 ESLint, Prettier
- [ ] 創建基礎資料夾結構

#### 1.2 型別定義
- [ ] 定義所有 DTO 和 Domain Types
- [ ] API 回應格式型別
- [ ] Google Maps 相關型別

#### 1.3 基礎組件開發
- [ ] Layout 組件
- [ ] Navigation 組件
- [ ] Loading 組件
- [ ] Error Boundary

#### 1.4 地圖整合
- [ ] Google Maps JavaScript API 整合
- [ ] 地圖顯示組件
- [ ] 使用者位置取得
- [ ] 地圖標記 (Marker) 組件

### 第二階段：核心功能前端 (Day 3-4)

#### 2.1 寶藏相關組件
- [ ] TreasureCard 組件 (地圖上的卡片)
- [ ] TreasureModal 組件 (詳細資訊彈窗)
- [ ] TreasureForm 組件 (創建/編輯表單)
- [ ] TreasureTypeIcon 組件

#### 2.2 互動功能組件
- [ ] LikeButton 組件
- [ ] FavoriteButton 組件
- [ ] CommentSection 組件
- [ ] CommentForm 組件

#### 2.3 搜尋和篩選
- [ ] SearchBar 組件
- [ ] FilterPanel 組件
- [ ] TreasureTypeFilter 組件

#### 2.4 Context 和 Hooks
- [ ] AuthContext (認證狀態管理)
- [ ] TreasureContext (寶藏資料管理)
- [ ] useGoogleMaps Hook
- [ ] useGeolocation Hook
- [ ] useTreasures Hook

### 第三階段：後端 API 開發 (Day 5-6)

#### 3.1 專案設定
- [ ] Express TypeScript 專案初始化
- [ ] Prisma 設定
- [ ] 資料庫 Schema 設計
- [ ] 環境變數設定

#### 3.2 認證系統
- [ ] Google OAuth 整合
- [ ] JWT Token 處理
- [ ] 認證中間件
- [ ] 權限檢查中間件

#### 3.3 核心 API 端點
- [ ] Auth Controller (/api/auth/*)
- [ ] Treasure Controller (/api/treasures/*)
- [ ] Comment Controller (/api/comments/*)
- [ ] Upload Controller (/api/upload)

#### 3.4 服務層實作
- [ ] AuthService (認證業務邏輯)
- [ ] TreasureService (寶藏業務邏輯)
- [ ] GeolocationService (地理位置相關)
- [ ] FileUploadService (檔案處理)

### 第四階段：資料庫和整合 (Day 7)

#### 4.1 資料庫設定
- [ ] Prisma Schema 完善
- [ ] 資料庫遷移
- [ ] 種子資料

#### 4.2 Repository 層
- [ ] UserRepository
- [ ] TreasureRepository
- [ ] CommentRepository
- [ ] LikeRepository
- [ ] FavoriteRepository

#### 4.3 Google Maps 後端整合
- [ ] Geocoding API 整合
- [ ] Places API 整合 (可選)
- [ ] 距離計算功能

### 第五階段：進階功能 (Day 8-9)

#### 5.1 檔案上傳
- [ ] 音樂檔案上傳處理
- [ ] 錄音檔上傳處理
- [ ] 檔案類型驗證
- [ ] 檔案大小限制

#### 5.2 即時位置功能
- [ ] 「活在當下」位置驗證
- [ ] 20公尺範圍檢查
- [ ] 位置更新機制

#### 5.3 搜尋優化
- [ ] 地理位置範圍搜尋
- [ ] 標籤搜尋
- [ ] 分頁功能

### 第六階段：測試和文件 (Day 10)

#### 6.1 API 文件
- [ ] OpenAPI/Swagger 設定
- [ ] API 端點文件化
- [ ] 測試用例撰寫

#### 6.2 測試
- [ ] 前端組件測試
- [ ] API 端點測試
- [ ] 整合測試

#### 6.3 部署準備
- [ ] 環境變數範例
- [ ] Docker 設定 (可選)
- [ ] 部署文件

## 技術決策

### 前端技術選擇
1. **Next.js 14+**: 最新版本，支援 App Router
2. **Mantine UI v7**: 現代化 React 組件庫
3. **Google Maps JavaScript API**: 地圖核心功能
4. **React Query/SWR**: API 狀態管理
5. **Zustand**: 輕量級狀態管理

### 後端技術選擇
1. **Express**: 成熟的 Node.js 框架
2. **Prisma**: 現代化 ORM
3. **PostgreSQL**: 關聯式資料庫
4. **Multer**: 檔案上傳處理
5. **Swagger/OpenAPI**: API 文件生成

### 開發工具
1. **TypeScript**: 全專案型別安全
2. **ESLint + Prettier**: 程式碼品質
3. **Husky**: Git Hooks
4. **Jest**: 測試框架

## 風險評估

### 高風險項目
1. **Google Maps API 配額**: 需要監控使用量
2. **檔案上傳大小**: 需要適當限制
3. **位置權限**: 使用者可能拒絕提供位置

### 中風險項目
1. **OAuth 整合**: 需要正確設定回調 URL
2. **即時位置驗證**: 精度和性能考量
3. **資料庫查詢效能**: 地理位置查詢優化

### 風險緩解策略
1. **API 使用量監控**: 實作快取機制
2. **漸進式載入**: 分批載入寶藏資料
3. **錯誤處理**: 完善的錯誤提示和回退機制

## 效能優化計劃

1. **前端優化**:
   - 地圖標記虛擬化
   - 圖片 lazy loading
   - API 回應快取

2. **後端優化**:
   - 資料庫索引優化
   - API 回應壓縮
   - 檔案 CDN 整合

3. **整體架構**:
   - Redis 快取層 (可選)
   - 圖片壓縮和優化
   - API 限流機制