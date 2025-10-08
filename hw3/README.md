# 🏛️ Antique Gallery - 沉浸式古董展覽網站

融合現代技術與古典藝術的互動式 3D 古董展覽平台

一個結合了 **2D 瀏覽** 與 **3D 虛擬實境** 體驗的現代化古董展覽網站。用戶可以在傳統的網頁界面中瀏覽古董集合，並進入沉浸式的 VR Gallery，以第一人稱視角在虛擬展覽館中自由探索已購買的古董收藏。

使用 CDN 和 cache 技術優化模型載入的處理，提升使用體驗。

線上看：https://antiquegallery.vercel.app

## ✨ 核心功能

### 🛍️ **電商購物體驗**
- **智慧搜尋與篩選** - 多維度搜尋引擎，支援名稱、類別、年代等篩選
- **動態排序** - 按價格、年代、名稱等多種方式靈活排序
- **購物車系統** - 完整的添加、移除、數量調整功能
- **本地儲存** - 購物車狀態持久化，重新載入不遺失

### 🎮 **沉浸式 VR Gallery**
- **3D 虛擬展覽館** - 使用 Three.js 構建的逼真展覽空間
- **第一人稱探索** - FPS 風格的自由移動與視角控制
- **動態展示** - 古董模型自動浮動與旋轉動畫
- **智慧碰撞檢測** - 真實的物理邊界，無法穿越展示櫃和牆壁
- **互動式資訊** - 靠近展示櫃時自動顯示古董詳細資訊

### 💾 **個人收藏管理**
- **收藏記錄** - 完整的購買歷史追蹤
- **3D 模型展示** - 每件收藏品都有對應的 3D 模型
- **展覽館布置** - 自動將購買的古董放置在虛擬展覽館中

## 🚀 技術亮點

### **前端架構**
- **Next.js 15.5.4** - 最新的 React 全端框架，支援 Turbopack
- **TypeScript** - 完整的型別安全與開發體驗
- **Tailwind CSS 4** - 現代化的原子化 CSS 框架
- **React Hooks** - 狀態管理與業務邏輯分離

### **3D 渲染技術**
- **Three.js** - 強大的 WebGL 3D 圖形庫
- **GLTFLoader** - 高效的 3D 模型載入與渲染
- **Pointer Lock Controls** - 真實的 FPS 控制體驗
- **模型快取系統** - 智慧載入，避免重複下載

### **效能優化**
- **智慧快取** - 3D 模型與場景的記憶體快取
- **懶載入** - 按需載入 3D 資源
- **DOM 優化** - 高效的事件處理與記憶體管理
- **響應式設計** - 完美支援各種螢幕尺寸

## 🛠️ 技術棧

```
Frontend Framework:  Next.js 15.5.4 + React 19
Language:           TypeScript 5
Styling:            Tailwind CSS 4
3D Graphics:        Three.js + @types/three
State Management:   React Context + Custom Hooks
Data Persistence:   localStorage
Development:        Turbopack (Next.js)
```

## 📦 安裝與執行

### 環境需求
- Node.js 18.0 或更高版本
- npm, yarn, pnpm 或 bun

### 快速開始
```bash
npm install
```

```bash
npm run dev
```

## 🎯 使用指南

### **2D 瀏覽模式**
1. 使用搜尋欄快速找到心儀的古董
2. 利用排序功能按需求整理商品
3. 點擊古董卡片查看 3D 預覽
4. 添加到購物車並完成購買

### **VR Gallery 體驗**
1. 點擊右上角的 🏛️ Gallery 按鈕
2. 載入完成後點擊任意位置啟動 FPS 模式
3. 使用 **WASD** 移動，**滑鼠** 控制視角
4. 靠近展示櫃自動顯示古董資訊
5. 按 **ESC** 鍵退出 VR 模式

## 🏗️ 專案架構

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css      # 全域樣式
│   ├── layout.tsx       # 根佈局
│   └── page.tsx         # 首頁
├── components/          # React 組件
│   ├── AntiqueGrid.tsx  # 古董網格展示
│   ├── Cart.tsx         # 購物車
│   ├── Collection.tsx   # 個人收藏
│   ├── Header.tsx       # 網站標頭
│   ├── PointerLockGallery.tsx  # VR Gallery
│   ├── SearchBar.tsx    # 搜尋列
│   └── ThreeGallery.tsx # 3D 展覽館
├── hooks/               # 自定義 Hooks
│   ├── useAntiques.ts   # 古董資料管理
│   ├── useSearch.ts     # 搜尋功能
│   └── usePointerLockGallery.ts # VR Gallery 邏輯
├── contexts/            # React Context
│   ├── CartContext.tsx  # 購物車狀態
│   └── CollectionContext.tsx # 收藏狀態
├── styles/              # 樣式系統
│   └── components.ts    # 組件樣式
├── types/               # TypeScript 型別定義
│   └── index.ts
└── utils/               # 工具函數
    └── analytics.ts     # 分析工具
```

## 🔮 技術特色

### **模組化架構**
- **關注點分離** - UI 組件與業務邏輯完全分離
- **可重用性** - 高度模組化的組件設計
- **型別安全** - 完整的 TypeScript 型別覆蓋

### **效能優化策略**
- **3D 模型快取** - 避免重複載入，提升使用體驗
- **智慧初始化** - 按需創建 3D 場景與資源
- **記憶體管理** - 正確的資源清理與記憶體釋放

### **使用者體驗**
- **流暢的動畫** - 60fps 的 3D 渲染效能
- **直覺的操作** - 符合遊戲習慣的 FPS 控制
- **響應式設計** - 適配各種裝置與螢幕