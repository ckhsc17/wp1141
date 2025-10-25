# Backend Deployment Guide - Google Cloud Platform

本文件提供將後端應用程式部署到 Google Cloud Platform (GCP) 的詳細步驟。

## 概述

本專案使用以下 GCP 服務：
- **Cloud SQL for PostgreSQL**: 資料庫管理
- **Cloud Run**: 後端服務部署
- **Cloud Storage**: 靜態資源儲存（可選）
- **Secret Manager**: 密鑰管理（可選）

## 前置需求

1. 安裝 [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install)
2. 建立 GCP 專案
3. 啟用必要的 API
4. 設定 gcloud 認證

```bash
# 登入 Google Cloud
gcloud auth login

# 設定預設專案
gcloud config set project YOUR_PROJECT_ID
```

## 步驟 1: 啟用必要的 API

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com
```

## 步驟 2: 建立 Cloud SQL 資料庫

### 2.1 建立 PostgreSQL 實例

```bash
gcloud sql instances create treasure-map-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=asia-east1 \
  --root-password=YOUR_PASSWORD
```

**注意**: 
- 選擇適合的地區（如 `asia-east1` 台灣）
- 選擇適當的 tier（`db-f1-micro` 是最便宜的）
- 設定強密碼

### 2.2 建立資料庫

```bash
gcloud sql databases create treasure_map \
  --instance=treasure-map-db
```

### 2.3 建立資料庫使用者

```bash
gcloud sql users create treasure_user \
  --instance=treasure-map-db \
  --password=DB_USER_PASSWORD
```

### 2.4 取得連線名稱

```bash
gcloud sql instances describe treasure-map-db \
  --format="value(connectionName)"
```

記錄下連線名稱，格式類似：`PROJECT_ID:asia-east1:treasure-map-db`

## 步驟 3: 設定環境變數

### 3.1 後端環境變數

創建 `.env.production` 檔案：

```bash
# 資料庫配置（使用 Cloud SQL Unix socket）
DATABASE_URL="postgresql://db_user:PASSWORD@/treasure_map?host=/cloudsql/PROJECT_ID:asia-east1:treasure-map-db"

# JWT 密鑰
JWT_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# 伺服器配置
PORT=8080
NODE_ENV=production
```

### 3.2 設定 Cloud Run 環境變數

```bash
gcloud run services update treasure-map-backend \
  --set-env-vars="DATABASE_URL=postgresql://...","JWT_SECRET=...","GOOGLE_CLIENT_ID=..." \
  --region=asia-east1
```

或使用 Secret Manager（推薦）：

```bash
# 建立 secret
echo -n "postgresql://..." | gcloud secrets create database-url --data-file=-

# 在 Cloud Run 中引用
gcloud run services update treasure-map-backend \
  --update-secrets=DATABASE_URL=database-url:latest \
  --region=asia-east1
```

## 步驟 4: Dockerfile 說明

專案已包含 `Dockerfile`，採用多階段建置：

- **Build stage**: 建置 TypeScript 和生成 Prisma client
- **Production stage**: 僅包含生產環境必要的文件
- 使用非 root 使用者執行，提高安全性
- 包含健康檢查機制

## 步驟 5: 建立 Cloud Run 服務

### 5.1 使用 Cloud Build 部署（推薦）

```bash
cd hw4/backend

# 使用 cloudbuild.yaml 自動建置和部署
npm run deploy

# 或手動執行
gcloud builds submit --config=cloudbuild.yaml
```

### 5.2 手動部署

```bash
# 建置映像檔
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/treasure-map-backend

# 部署到 Cloud Run
gcloud run deploy treasure-map-backend \
  --image gcr.io/YOUR_PROJECT_ID/treasure-map-backend \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --add-cloudsql-instances=PROJECT_ID:asia-east1:treasure-map-db \
  --set-env-vars="NODE_ENV=production" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=80
```

**重要參數說明**:
- `--add-cloudsql-instances`: 連接 Cloud SQL 實例
- `--allow-unauthenticated`: 允許匿名訪問
- `--memory`: 記憶體限制
- `--timeout`: 請求超時時間（秒）

## 步驟 6: 執行資料庫遷移

### 6.1 使用 Cloud SQL Proxy（推薦用於測試）

```bash
# 下載 Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# 啟動 Proxy（在另一個終端執行）
./cloud_sql_proxy -instances=PROJECT_ID:asia-east1:treasure-map-db=tcp:5432

# 在 backend 目錄執行遷移
cd hw4/backend
export DATABASE_URL="postgresql://db_user:PASSWORD@localhost:5432/treasure_map"
npx prisma migrate deploy
```

### 6.2 從 Cloud Run 容器執行（生產環境）

```bash
# 使用 Cloud Run Jobs
gcloud run jobs create migrate-db \
  --image gcr.io/YOUR_PROJECT_ID/treasure-map-backend \
  --region asia-east1 \
  --task-timeout=600 \
  --add-cloudsql-instances=PROJECT_ID:asia-east1:treasure-map-db \
  --command="npx" \
  --args="prisma,migrate,deploy"

# 執行任務
gcloud run jobs execute migrate-db --region asia-east1
```

## 步驟 7: 本地測試

```bash
cd hw4/backend

# 建置 Docker 映像
npm run docker:build

# 執行容器
npm run docker:run
```

## 步驟 8: 設定 CORS 和防火牆

### 8.1 設定 Cloud SQL 授權網路

```bash
# 允許所有 IP（僅用於開發，生產環境建議限制特定 IP）
gcloud sql instances patch treasure-map-db \
  --authorized-networks=0.0.0.0/0
```

### 8.2 設定 CORS（在後端代碼中）

確保前端域名已加入 CORS 白名單：

```typescript
// backend/src/app.ts
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
  credentials: true
}));
```

## 步驟 9: 監控和日誌

### 9.1 查看日誌

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=treasure-map-backend" \
  --limit=50
```

### 9.2 在 Cloud Console 中查看

- [Cloud Run 控制台](https://console.cloud.google.com/run)
- [Cloud SQL 控制台](https://console.cloud.google.com/sql)
- [Cloud Logging](https://console.cloud.google.com/logs)

## 步驟 10: 設定 HTTPS 和自訂域名（可選）

```bash
# 將自訂域名映射到 Cloud Run
gcloud run domain-mappings create \
  --service=treasure-map-backend \
  --domain=api.yourdomain.com \
  --region=asia-east1
```

## 自動化部署 (CI/CD)

### 使用 GitHub Actions

創建 `.github/workflows/deploy-backend.yml`：

```yaml
name: Deploy Backend to GCP

on:
  push:
    branches: [main]
    paths:
      - 'hw4/backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Deploy to Cloud Run
        run: |
          cd hw4/backend
          npm run deploy
```

## 成本估計

### Cloud SQL (db-f1-micro)
- **記憶體**: 0.6 GB
- **儲存**: 10 GB
- **價格**: 約 $0.5-1/月

### Cloud Run
- **記憶體**: 512Mi
- **CPU**: 1 vCPU
- **請求**: 前 200 萬次免費
- **價格**: 超出後約 $0.4/百萬次

### 總計
- **預估月費**: $1-5 (低流量情況下)
- **免費額度**: 適用於開發和小型專案

## 故障排除

### 資料庫連線失敗

1. 確認 Cloud SQL 實例已啟動
2. 檢查 `--add-cloudsql-instances` 設定
3. 確認資料庫使用者權限
4. 檢查防火牆規則

### Cloud Run 啟動失敗

1. 查看容器日誌
2. 確認環境變數設定
3. 檢查 Dockerfile 和建置過程
4. 驗證埠號設定（Cloud Run 會自動設定 PORT）

### 效能問題

1. 調整 Cloud Run 的記憶體和 CPU
2. 啟用 Cloud SQL 連線池
3. 實施快取策略
4. 優化資料庫查詢

## 參考資源

- [Cloud Run 文件](https://cloud.google.com/run/docs)
- [Cloud SQL 文件](https://cloud.google.com/sql/docs)
- [Node.js 最佳實踐](https://cloud.google.com/nodejs/docs/best-practices)

## 支援

如有問題，請查閱：
1. GCP 官方文件
2. 專案 README.md
3. 聯絡開發團隊
