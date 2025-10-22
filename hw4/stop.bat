@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM 尋寶地圖應用 - 停止腳本 (Windows)
REM 作者: 尋寶地圖開發團隊
REM 版本: 1.0.0

echo ====================================
echo    🛑 尋寶地圖應用 - 停止服務
echo ====================================
echo.

REM 停止 Node.js 進程
echo [INFO] 停止 Node.js 服務...
taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 沒有找到運行中的 Node.js 進程
) else (
    echo [SUCCESS] Node.js 服務已停止
)

REM 停止 Docker 服務
echo [INFO] 停止 Docker 服務...
if exist "docker-compose.yml" (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        docker-compose --version >nul 2>&1
        if errorlevel 1 (
            echo [WARNING] 找不到 Docker Compose 命令
        ) else (
            docker-compose down
            echo [SUCCESS] Docker 服務已停止
        )
    ) else (
        docker compose down
        echo [SUCCESS] Docker 服務已停止
    )
) else (
    echo [WARNING] 找不到 docker-compose.yml 文件
)

REM 清理臨時文件
echo [INFO] 清理臨時文件...
if exist "logs" (
    del /q logs\*.pid >nul 2>&1
)

echo.
echo [SUCCESS] 🎉 所有服務已停止
echo.

pause
