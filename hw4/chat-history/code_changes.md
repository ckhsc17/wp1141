# 代碼修改記錄

## 文件修改摘要

### Frontend 修改

#### 1. `src/services/treasureService.ts`
**修改原因**: CORS 問題 - API 格式不匹配  
**修改內容**: 條件式格式處理
```typescript
// 修改前：總是使用 FormData
// 修改後：根據是否有媒體選擇格式
const hasMedia = treasureData.mediaUrl && treasureData.mediaUrl !== '';

if (hasMedia) {
  // FormData for media uploads
  const formData = new FormData();
  Object.entries(treasureData).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  return apiService.post(API_ENDPOINTS.TREASURES.CREATE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
} else {
  // JSON for simple treasure creation
  return apiService.post(API_ENDPOINTS.TREASURES.CREATE, treasureData);
}
```

#### 2. `src/constants/index.ts`
**修改原因**: API 端點標準化  
**修改內容**: 添加 Google OAuth 端點
```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    GOOGLE: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile'
  },
  // ... 其他端點
};
```

#### 3. `src/components/LoginPage.tsx`
**修改原因**: 使用常數化 API 端點  
**修改內容**: 
```typescript
// 修改前
window.location.href = `${API_BASE_URL}/api/auth/google`;

// 修改後  
window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`;
```

#### 4. `src/app/auth/google/callback/page.tsx`
**修改原因**: 使用常數化 API 端點  
**修改內容**:
```typescript
// 修改前
const response = await fetch(`${API_BASE_URL}/api/auth/google/callback?code=${code}`);

// 修改後
const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_CALLBACK}?code=${code}`);
```

#### 5. `src/app/page.tsx`
**修改原因**: UI 改善 - 移除位置按鈕，自動檢測位置  
**修改內容**:
```typescript
// 移除位置按鈕，添加自動位置檢測
useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        // 設置默認位置 (台北101)
        setUserLocation({
          latitude: 25.033964,
          longitude: 121.564468
        });
      }
    );
  }
}, []);
```

#### 6. `src/components/GoogleMapComponent.tsx`
**修改原因**: 視覺改善 - 添加寶藏圖標  
**修改內容**:
```typescript
import { GiTreasureMap } from 'react-icons/gi';

// 在標記中使用寶藏圖標
<GiTreasureMap 
  size={24} 
  color="#f59e0b" 
  style={{ 
    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
    cursor: 'pointer' 
  }}
/>
```

### Backend 修改

#### 1. `src/middleware/validation.ts`
**修改原因**: CUID vs UUID 驗證衝突  
**修改內容**: 添加 CUID 驗證函數
```typescript
// 添加 CUID 驗證
export const validateCUID = (value: string): boolean => {
  const cuidPattern = /^c[a-z0-9]{24,}$/;
  return cuidPattern.test(value);
};

// 更新參數驗證
export const validateCUIDParam = (paramName: string) => {
  return [
    param(paramName)
      .custom((value) => {
        if (!validateCUID(value)) {
          throw new Error(`${paramName} must be a valid CUID`);
        }
        return true;
      })
  ];
};
```

#### 2. `src/routes/treasures.ts`
**修改原因**: 使用正確的 CUID 驗證  
**修改內容**:
```typescript
// 修改前
router.get('/:id', validateUUIDParam('id'), getTreasureById);

// 修改後
router.get('/:id', validateCUIDParam('id'), getTreasureById);
```

#### 3. `src/controllers/treasureController.ts`
**修改原因**: Controller-Service 架構重構  
**主要修改**:

1. **更新 imports**:
```typescript
// 移除
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 添加
import { TreasureService } from '../services/treasureService';
const treasureService = new TreasureService();
```

2. **重構 getTreasures**:
```typescript
// 修改前：直接使用 Prisma
const treasures = await prisma.treasure.findMany({...});

// 修改後：使用 Service
const result = await treasureService.getTreasures(query, currentUserId);
```

3. **重構所有 CRUD 方法**:
- `getTreasureById` -> `treasureService.getTreasureById`
- `createTreasure` -> `treasureService.createTreasure`
- `updateTreasure` -> `treasureService.updateTreasure`
- `deleteTreasure` -> `treasureService.deleteTreasure`
- `toggleLike` -> `treasureService.toggleLike`
- `toggleFavorite` -> `treasureService.toggleFavorite`

4. **移除重複函數**:
```typescript
// 移除了 calculateDistance 和 transformTreasure
// 這些邏輯現在在 TreasureService 中
```

#### 4. `src/config/swagger.ts`
**修改原因**: 修復 Swagger GUID 驗證錯誤  
**修改內容**:
```typescript
// 修改前
TreasureId: {
  type: 'string',
  format: 'uuid',
  description: 'Unique identifier for treasure'
}

// 修改後
TreasureId: {
  type: 'string',
  pattern: '^c[a-z0-9]{24,}$',
  description: 'Unique CUID identifier for treasure'
}
```

#### 5. Controller Swagger 註解修改
**修改原因**: 移除 UUID 格式限制  
**修改內容**: 所有 controller 中的 Swagger 註解
```yaml
# 修改前
parameters:
  - name: id
    schema:
      type: string
      format: uuid

# 修改後  
parameters:
  - name: id
    schema:
      type: string
      pattern: "^c[a-z0-9]{24,}$"
```

## 架構變更

### 前端架構
```
Components -> Services -> API -> Backend
     ↓           ↓        ↓        ↓
   UI Logic   API Calls  HTTP   Controller
```

### 後端架構
```
Routes -> Validation -> Controller -> Service -> Prisma
   ↓         ↓            ↓          ↓         ↓
Request   Validate     HTTP       Business   Database
Routing   Params      Layer       Logic     Operations
```

## 測試狀態

### 已測試 ✅
- CORS 問題修復
- API 端點常數化
- CUID 驗證
- Swagger 配置

### 待測試 🔄
- 完整 CRUD 操作
- Like/Favorite 功能
- 媒體上傳
- 錯誤處理

## 回滾信息

如需回滾，主要變更點：
1. `treasureService.ts` - 條件式格式處理
2. `treasureController.ts` - Service 層調用
3. `validation.ts` - CUID 驗證
4. `swagger.ts` - 移除 UUID 格式限制

每個修改都有明確的 git commit，可以按需求回滾特定功能。