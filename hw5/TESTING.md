# 測試文件

本專案使用 Jest 和 React Testing Library 進行單元測試和組件測試。

## 測試架構

### 工具
- **Jest**: 測試框架
- **React Testing Library**: 組件測試工具
- **User Event**: 用戶互動測試
- **Axios Mock**: API 請求模擬

### 測試結構
```
src/
├── __tests__/
│   └── utils/                    # 測試工具函式
│       ├── test-utils.tsx       # renderWithProviders
│       └── mocks.ts             # Mock 資料
├── components/
│   └── __tests__/               # 組件測試
│       ├── PostCard.test.tsx
│       ├── PostForm.test.tsx
│       └── AppBar.test.tsx
└── hooks/
    └── __tests__/               # Hooks 測試
        └── usePosts.test.ts
```

## 執行測試

```bash
# 執行所有測試
npm test

# 監視模式
npm run test:watch

# 產生覆蓋率報告
npm run test:coverage
```

## 測試覆蓋範圍

### 組件測試
- ✅ **PostCard**: 渲染、互動、狀態顯示
- ✅ **PostForm**: 表單提交、驗證、載入狀態
- ✅ **AppBar**: 導覽、認證狀態、主題切換

### Hooks 測試
- ✅ **usePosts**: CRUD 操作、分頁、錯誤處理
- ✅ **useComments**: 新增、刪除留言
- ✅ **useLike**: 按讚切換
- ✅ **useUser**: 使用者資料取得

### 測試工具
- ✅ **renderWithProviders**: 提供完整的測試環境
- ✅ **Mock Data**: 標準化的測試資料

## 撰寫測試的最佳實踐

### 1. 測試命名
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {})
  it('should handle user interaction', () => {})
  it('should display error state', () => {})
})
```

### 2. 使用 renderWithProviders
```typescript
import { renderWithProviders } from '@/__tests__/utils/test-utils'

renderWithProviders(<MyComponent />, { session: mockSession })
```

### 3. Mock 外部依賴
```typescript
jest.mock('next-auth/react')
jest.mock('@/hooks')
```

### 4. 測試用戶互動
```typescript
import { userEvent } from '@/__tests__/utils/test-utils'

const user = userEvent.setup()
await user.click(button)
```

## 測試資料

使用 `@faker-js/faker` 產生真實的測試資料：

- 20 個用戶
- 每個用戶 3-8 則貼文
- 每個貼文 30-70% 用戶按讚
- 30-50% 貼文有留言

## 持續改進

- [ ] 增加 E2E 測試
- [ ] 增加整合測試
- [ ] 提高覆蓋率到 80%+
- [ ] 添加視覺回歸測試

