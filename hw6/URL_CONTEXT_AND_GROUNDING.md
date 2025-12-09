# URL Context 與 Grounding Search 使用說明

## 概述

`linkService` 現在同時使用 **URL Context** 和 **Google Search Grounding** 來分析連結：

1. **URL Context**：直接讀取用戶提供的 URL 內容，用於分析連結的實際內容
2. **Google Search Grounding**：搜尋相關資訊和類似連結，用於推薦和補充資訊

## 當前實現

### 1. Grounding Search 的 Response 解析

在 `geminiService.ts` 的 `generateWithGrounding` 方法中：

```typescript
// 從 response.candidates[0].groundingMetadata 提取
if (candidate.groundingMetadata) {
  const metadata = candidate.groundingMetadata;
  groundingMetadata = {
    webSearchQueries: metadata.webSearchQueries,  // 搜尋查詢列表
    groundingChunks: metadata.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || '',    // 找到的相關連結
      title: chunk.web?.title || '', // 連結標題
    })),
    groundingSupports: metadata.groundingSupports, // 支援資訊
  };
}
```

### 2. URL Context 的使用

新增了 `generateWithUrlContextAndGrounding` 方法，同時使用兩個工具：

```typescript
const tools = [
  { urlContext: {} },    // 讀取用戶提供的 URL
  { googleSearch: {} },  // 搜尋相關資訊
];
```

### 3. 如何利用 Grounding Search 推薦類似連結

`groundingMetadata.groundingChunks` 中包含 Google Search 找到的相關連結，這些可以用來：

1. **儲存在 metadata 中**：目前已經儲存在 `metadata.grounding.sources` 中
2. **推薦給用戶**：可以在推薦功能中使用這些連結

#### 使用範例

```typescript
// 在 linkService 中，groundingChunks 已經被儲存
if (result.groundingMetadata) {
  metadata.grounding = {
    webSearchQueries: result.groundingMetadata.webSearchQueries || [],
    sources: result.groundingMetadata.groundingChunks?.map((chunk) => ({
      uri: chunk.uri,    // 可以用來推薦的連結
      title: chunk.title, // 連結標題
    })) || [],
  };
}
```

#### 在推薦功能中使用

可以在 `recommendationService.ts` 中利用這些連結：

```typescript
// 從用戶儲存的連結中提取 grounding sources
const savedLinks = await savedItemRepo.findByType(userId, 'link');
const similarLinks = savedLinks
  .flatMap(link => (link.metadata?.grounding?.sources || []))
  .filter(source => source.uri !== originalUrl); // 排除原始連結

// 使用這些連結來推薦
```

## 工作流程

1. **用戶分享連結** → `linkService.analyzeAndSave()`
2. **使用 URL Context** → 直接讀取連結內容
3. **使用 Google Search** → 搜尋相關資訊和類似連結
4. **分析結果** → 提取類型、摘要、標籤、地點等
5. **儲存 metadata** → 包含 URL context 狀態和 grounding sources
6. **推薦使用** → `groundingChunks` 中的連結可以用於推薦功能

## 優勢

- **更準確的分析**：直接讀取 URL 內容，不依賴搜尋結果
- **更好的推薦**：Google Search 找到的類似連結可以用來推薦
- **互補資訊**：URL Context 提供實際內容，Google Search 提供相關資訊

## 注意事項

- URL Context 可能會因為 URL 無法訪問而失敗（`URL_RETRIEVAL_STATUS_UNSAFE` 或失敗狀態）
- 此時會 fallback 到只使用 Google Search
- Grounding Search 的結果會儲存在 metadata 中，可以後續使用
