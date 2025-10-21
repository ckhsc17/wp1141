# 技術問題排查記錄

## CORS 問題解決 (2024-10-21)

### 問題描述
用戶後端 curl 測試正常，但前端一直出現 CORS 錯誤。

### 問題分析
1. 後端 curl 使用 JSON 格式成功
2. 前端 treasureService.createTreasure 在有 media 時使用 FormData
3. 格式不匹配導致 API 調用失敗

### 解決方案
```typescript
// 修改 treasureService.ts
const hasMedia = treasureData.mediaUrl && treasureData.mediaUrl !== '';

if (hasMedia) {
  // Use FormData for media uploads
  const formData = new FormData();
  // ... FormData logic
} else {
  // Use JSON for simple treasure creation
  return apiService.post(API_ENDPOINTS.TREASURES.CREATE, treasureData);
}
```

## 驗證問題解決

### CUID vs UUID 格式衝突

#### 問題
- Prisma schema 使用 `@default(cuid())`
- 驗證中間件檢查 UUID 格式
- Swagger 配置要求 GUID 格式

#### 解決步驟
1. **更新驗證中間件**:
```typescript
// validation.ts
export const validateCUID = (value: string): boolean => {
  const cuidPattern = /^c[a-z0-9]{24,}$/;
  return cuidPattern.test(value);
};
```

2. **修改 Swagger 配置**:
```yaml
# 移除 format: 'uuid' 限制
schema:
  type: string
  pattern: "^c[a-z0-9]{24,}$"
```

## 架構重構記錄

### Controller-Service 分離

#### 重構前問題
- Controller 直接使用 Prisma
- 業務邏輯混在 HTTP 處理中
- 重複代碼 (calculateDistance, transformTreasure)

#### 重構後架構
```
Controller -> Service -> Prisma
     ↓         ↓         ↓
  HTTP       Business   Data
 Layer       Logic     Layer
```

#### 重構步驟
1. 移除 Controller 中的 Prisma 直接調用
2. 使用 TreasureService 方法
3. 統一錯誤處理格式
4. 移除重複的輔助函數

## API 端點標準化

### 常數管理改善
```typescript
// constants.ts
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
  },
  TREASURES: {
    CREATE: '/api/treasures',
    GET_ALL: '/api/treasures',
    // ...
  }
};
```

### 更新的組件
- LoginPage.tsx
- auth/google/callback/page.tsx
- treasureService.ts
- userService.ts

## UI/UX 改善記錄

### 自動位置檢測
- 移除「我的位置」按鈕
- 添加 useEffect 自動獲取位置
- 改善用戶體驗流程

### 視覺增強
- 使用 react-icons/gi 的 GiTreasureMap
- 在地圖上顯示寶藏圖標
- 增加 hover 效果

## 測試用例

### API 測試命令
```bash
# 成功的 curl 命令
curl -X POST "http://localhost:3000/api/treasures" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "title": "測試寶藏",
    "content": "這是一個測試用的寶藏",
    "type": "PHOTO",
    "latitude": 25.033964,
    "longitude": 121.564468,
    "address": "台北市信義區",
    "tags": ["測試", "照片"]
  }'
```

### 前端測試流程
1. 登入系統
2. 創建寶藏 (有/無媒體)
3. 查看寶藏列表
4. 測試 Like/Favorite 功能
5. 驗證地圖顯示

## 已知問題與待解決

### 已解決 ✅
- CORS 問題
- CUID 驗證
- Swagger GUID 錯誤
- Controller-Service 架構
- API 端點標準化

### 待測試 🔄
- 完整的 CRUD 操作
- Like/Favorite 功能
- 媒體上傳功能
- 地圖互動功能

### 優化建議 💡
- 添加更多錯誤處理
- 實現更好的載入狀態
- 添加操作確認對話框
- 實現離線功能支持