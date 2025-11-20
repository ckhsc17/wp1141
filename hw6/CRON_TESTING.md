# Cron Job 本地測試指南

## 方法 1：直接調用本地 Endpoint（最簡單）

### 如果沒有設置 CRON_SECRET

```bash
# 直接調用本地 endpoint
curl http://localhost:3000/api/cron/check-todo-notifications

# 或使用 ngrok URL
curl https://your-ngrok-url.ngrok.io/api/cron/check-todo-notifications
```

### 如果設置了 CRON_SECRET

```bash
# 本地測試（需要設置 CRON_SECRET 環境變數）
export CRON_SECRET=your-secret-key
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/check-todo-notifications

# 或使用 ngrok URL
curl -H "Authorization: Bearer your-secret-key" \
  https://your-ngrok-url.ngrok.io/api/cron/check-todo-notifications
```

## 方法 2：使用測試 Endpoint（推薦）

更簡單的方式是使用專門的測試 endpoint：

```bash
# 測試特定用戶的提醒
curl "http://localhost:3000/api/test/notification?userId=YOUR_LINE_USER_ID"

# 或使用 ngrok URL
curl "https://your-ngrok-url.ngrok.io/api/test/notification?userId=YOUR_LINE_USER_ID"
```

### 創建測試提醒並立即發送

```bash
curl -X POST http://localhost:3000/api/test/notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_LINE_USER_ID",
    "title": "測試提醒",
    "triggerAt": "2024-01-01T00:00:00Z"
  }'
```

## 方法 3：設置本地 Cron Job（模擬定期執行）

### macOS/Linux

```bash
# 編輯 crontab
crontab -e

# 添加以下行（每 5 分鐘執行一次）
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-ngrok-url.ngrok.io/api/cron/check-todo-notifications
```

### 使用 watch 命令（臨時測試）

```bash
# 每 30 秒執行一次
watch -n 30 'curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-ngrok-url.ngrok.io/api/cron/check-todo-notifications'
```

## 測試步驟

1. **確保本地服務運行**
   ```bash
   npm run dev
   ```

2. **啟動 ngrok**（如果需要從外部訪問）
   ```bash
   ngrok http 3000
   ```

3. **創建測試提醒**
   - 在 LINE bot 中創建一個待辦事項，設置 `date` 為過去時間
   - 或使用測試 endpoint 創建：
     ```bash
     curl -X POST http://localhost:3000/api/test/notification \
       -H "Content-Type: application/json" \
       -d '{
         "userId": "YOUR_LINE_USER_ID",
         "title": "測試提醒",
         "triggerAt": "'$(date -u -v-1M +%Y-%m-%dT%H:%M:%SZ)'"
       }'
     ```

4. **調用 cron endpoint**
   ```bash
   curl http://localhost:3000/api/cron/check-todo-notifications
   ```

5. **檢查結果**
   - 查看終端 log 輸出
   - 檢查 LINE 是否收到通知
   - 檢查資料庫中 reminder 的 status 是否變為 'SENT'

## 注意事項

1. **CRON_SECRET 是可選的**
   - 如果 `.env.local` 中沒有設置 `CRON_SECRET`，則不需要認證
   - 如果設置了，必須在 header 中提供 `Authorization: Bearer {CRON_SECRET}`

2. **ngrok URL 會變化**
   - 每次重啟 ngrok 都會獲得新的 URL
   - 如果需要固定 URL，可以使用 ngrok 的保留域名功能（需要付費）

3. **資料庫連接**
   - 確保本地資料庫正在運行
   - 確保 `DATABASE_URL` 環境變數正確設置

4. **LINE Channel Access Token**
   - 確保 `LINE_CHANNEL_ACCESS_TOKEN` 正確設置
   - 確保 token 沒有過期

## 預期回應

### 成功回應

```json
{
  "success": true,
  "checked": 1,
  "sent": 1,
  "errors": 0,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 沒有待發送的提醒

```json
{
  "success": true,
  "checked": 0,
  "sent": 0,
  "errors": 0,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 錯誤回應

```json
{
  "success": false,
  "error": "Error message"
}
```

## 除錯技巧

1. **查看詳細 log**
   - 檢查終端輸出
   - 所有操作都有 logger.info 或 logger.error

2. **檢查資料庫**
   ```bash
   # 查看待發送的提醒
   podman exec -it booboo-db psql -U booboo -d booboo_db -c \
     "SELECT id, userId, title, triggerAt, status FROM \"Reminder\" WHERE status = 'PENDING' AND \"triggerAt\" <= NOW();"
   ```

3. **測試 LINE API 連接**
   ```bash
   curl -X GET https://api.line.me/v2/bot/info \
     -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"
   ```

