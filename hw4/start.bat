@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM 尋寶地圖應用 - 一鍵啟動腳本 (Windows)
REM 作者: 尋寶地圖開發團隊
REM 版本: 1.0.0

echo ====================================
echo    🗺️  尋寶地圖應用 - 一鍵啟動
echo ====================================
echo.

REM 檢查是否在正確的目錄
if not exist "docker-compose.yml" (
    echo [ERROR] 找不到 docker-compose.yml 文件！
    echo [ERROR] 請在項目根目錄執行此腳本！
    pause
    exit /b 1
)

if not exist "backend" (
    echo [ERROR] 找不到 backend 目錄！
    echo [ERROR] 請在項目根目錄執行此腳本！
    pause
    exit /b 1
)

if not exist "frontend" (
    echo [ERROR] 找不到 frontend 目錄！
    echo [ERROR] 請在項目根目錄執行此腳本！
    pause
    exit /b 1
)

REM 檢查 Docker 是否安裝
echo [STEP] 檢查 Docker 安裝狀態...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安裝！
    echo [INFO] 請訪問 https://docs.docker.com/desktop/windows/ 安裝 Docker Desktop
    pause
    exit /b 1
) else (
    echo [SUCCESS] Docker 已安裝
    docker --version
)

REM 檢查 Docker 是否運行
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未運行！
    echo [INFO] 請啟動 Docker Desktop 應用程式
    pause
    exit /b 1
) else (
    echo [SUCCESS] Docker 運行正常
)

REM 檢查 Docker Compose 是否可用
echo [STEP] 檢查 Docker Compose 安裝狀態...
docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose 未安裝！
        echo [INFO] 請安裝 Docker Compose 或更新 Docker Desktop
        pause
        exit /b 1
    ) else (
        echo [SUCCESS] Docker Compose 已安裝 (舊版本)
        docker-compose --version
        set COMPOSE_CMD=docker-compose
    )
) else (
    echo [SUCCESS] Docker Compose 已安裝
    docker compose version
    set COMPOSE_CMD=docker compose
)

REM 檢查 Node.js 是否安裝
echo [STEP] 檢查 Node.js 安裝狀態...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 未安裝！
    echo [INFO] 請訪問 https://nodejs.org/ 安裝 Node.js
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js 已安裝
    node --version
)

REM 檢查 npm 是否安裝
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm 未安裝！
    echo [INFO] 請重新安裝 Node.js
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm 已安裝
    npm --version
)

REM 啟動 Docker 服務
echo [STEP] 啟動 Docker 服務...
echo [INFO] 停止舊的 Docker 容器...
%COMPOSE_CMD% down >nul 2>&1

echo [INFO] 啟動 PostgreSQL 和 Redis 服務...
%COMPOSE_CMD% up -d postgres redis
if errorlevel 1 (
    echo [ERROR] Docker 服務啟動失敗！
    pause
    exit /b 1
)

echo [INFO] 等待 PostgreSQL 啟動...
timeout /t 10 /nobreak >nul

REM 等待資料庫就緒
set /a counter=0
:wait_db
set /a counter+=1
docker exec treasure-map-db pg_isready -U treasure_user -d treasure_map >nul 2>&1
if errorlevel 1 (
    if !counter! geq 30 (
        echo [ERROR] PostgreSQL 啟動超時
        pause
        exit /b 1
    )
    echo [INFO] 等待 PostgreSQL 啟動... (!counter!/30)
    timeout /t 2 /nobreak >nul
    goto wait_db
)
echo [SUCCESS] PostgreSQL 已就緒

REM 安裝後端依賴
echo [STEP] 安裝後端依賴...
cd backend
if not exist "package.json" (
    echo [ERROR] 找不到後端 package.json 文件！
    pause
    exit /b 1
)

echo [INFO] 安裝 npm 套件...
call npm install
if errorlevel 1 (
    echo [ERROR] 後端依賴安裝失敗！
    pause
    exit /b 1
)
echo [SUCCESS] 後端依賴安裝完成
cd ..

REM 安裝前端依賴
echo [STEP] 安裝前端依賴...
cd frontend
if not exist "package.json" (
    echo [ERROR] 找不到前端 package.json 文件！
    pause
    exit /b 1
)

echo [INFO] 安裝 npm 套件...
call npm install
if errorlevel 1 (
    echo [ERROR] 前端依賴安裝失敗！
    pause
    exit /b 1
)
echo [SUCCESS] 前端依賴安裝完成
cd ..

REM 設置 Prisma
echo [STEP] 設置 Prisma...
cd backend

REM 檢查 .env 文件
if not exist ".env" (
    echo [WARNING] 找不到 .env 文件，創建預設配置...
    (
        echo # 資料庫配置
        echo DATABASE_URL="postgresql://treasure_user:treasure_password@localhost:5432/treasure_map"
        echo.
        echo # JWT 密鑰 ^(請在生產環境中更改^)
        echo JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
        echo JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-change-this-in-production"
        echo.
        echo # Google OAuth 配置 ^(請填入您的 Google OAuth 憑證^)
        echo GOOGLE_CLIENT_ID="your-google-client-id"
        echo GOOGLE_CLIENT_SECRET="your-google-client-secret"
        echo GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"
        echo.
        echo # 應用配置
        echo NODE_ENV="development"
        echo PORT=3001
        echo FRONTEND_URL="http://localhost:3000"
        echo.
        echo # 檔案上傳配置
        echo UPLOAD_DIR="uploads"
        echo MAX_FILE_SIZE="10485760"
    ) > .env
    echo [SUCCESS] 已創建預設 .env 文件
)

REM 生成 Prisma 客戶端
echo [INFO] 生成 Prisma 客戶端...
call npm run db:generate
if errorlevel 1 (
    echo [ERROR] Prisma 客戶端生成失敗！
    pause
    exit /b 1
)

REM 推送資料庫結構
echo [INFO] 推送資料庫結構...
call npm run db:push
if errorlevel 1 (
    echo [ERROR] 資料庫結構推送失敗！
    pause
    exit /b 1
)

REM 執行種子資料
echo [INFO] 執行資料庫種子...
call npm run db:seed
if errorlevel 1 (
    echo [WARNING] 資料庫種子執行失敗，但繼續啟動...
)

echo [SUCCESS] Prisma 設置完成
cd ..

REM 設置前端環境
echo [STEP] 設置前端環境...
cd frontend

REM 檢查 .env.local 文件
if not exist ".env.local" (
    echo [WARNING] 找不到 .env.local 文件，創建預設配置...
    (
        echo # API 配置
        echo NEXT_PUBLIC_API_URL=http://localhost:3001
        echo.
        echo # Google Maps API 金鑰 ^(請填入您的 Google Maps API 金鑰^)
        echo NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
        echo.
        echo # Google OAuth 配置
        echo NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
    ) > .env.local
    echo [SUCCESS] 已創建預設 .env.local 文件
    echo [WARNING] 請記得填入您的 Google Maps API 金鑰和 Google OAuth 設定
)
cd ..

REM 創建日誌目錄
if not exist "logs" mkdir logs

REM 啟動應用服務
echo [STEP] 啟動應用服務...

REM 啟動後端
echo [INFO] 啟動後端服務...
cd backend
start "Treasure Map Backend" cmd /c "npm run dev > ../logs/backend.log 2>&1"
cd ..

REM 等待後端啟動
echo [INFO] 等待後端服務啟動...
timeout /t 5 /nobreak >nul

REM 啟動前端
echo [INFO] 啟動前端服務...
cd frontend
start "Treasure Map Frontend" cmd /c "npm run dev > ../logs/frontend.log 2>&1"
cd ..

REM 顯示啟動資訊
echo.
echo ====================================
echo 🎉 尋寶地圖應用啟動完成！
echo ====================================
echo.
echo 📱 前端應用: http://localhost:3000
echo 🔧 後端 API: http://localhost:3001
echo 📊 API 文檔: http://localhost:3001/api-docs
echo 🗄️  資料庫管理: http://localhost:8080 (pgAdmin)
echo.
echo 📋 預設登入資訊:
echo   pgAdmin: admin@treasure-map.com / admin123
echo.
echo 📝 重要提醒:
echo   1. 請填入 Google Maps API 金鑰到 frontend/.env.local
echo   2. 請設定 Google OAuth 憑證到 backend/.env
echo   3. 日誌文件位於 logs/ 目錄
echo.
echo 🛑 停止服務: 執行 stop.bat 或關閉命令提示字元視窗
echo.

REM 等待用戶輸入
echo 按任意鍵關閉此視窗...
pause >nul
