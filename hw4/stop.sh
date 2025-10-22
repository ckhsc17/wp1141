#!/bin/bash

# 尋寶地圖應用 - 停止腳本 (macOS/Linux)
# 作者: 尋寶地圖開發團隊
# 版本: 1.0.0

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${BLUE}"
echo "=================================="
echo "   🛑 尋寶地圖應用 - 停止服務"
echo "=================================="
echo -e "${NC}"

# 停止前端服務
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        log_info "停止前端服務 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        log_success "前端服務已停止"
    else
        log_warning "前端服務已經停止"
    fi
    rm -f logs/frontend.pid
else
    log_warning "找不到前端服務 PID 文件"
fi

# 停止後端服務
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        log_info "停止後端服務 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        log_success "後端服務已停止"
    else
        log_warning "後端服務已經停止"
    fi
    rm -f logs/backend.pid
else
    log_warning "找不到後端服務 PID 文件"
fi

# 停止 Docker 服務
log_info "停止 Docker 服務..."
if [ -f "docker-compose.yml" ]; then
    if command_exists docker-compose; then
        docker-compose down
    elif docker compose version >/dev/null 2>&1; then
        docker compose down
    else
        log_warning "找不到 Docker Compose 命令"
    fi
    log_success "Docker 服務已停止"
else
    log_warning "找不到 docker-compose.yml 文件"
fi

# 清理臨時文件
log_info "清理臨時文件..."
rm -f logs/*.pid 2>/dev/null || true

echo ""
log_success "🎉 所有服務已停止"
echo ""
