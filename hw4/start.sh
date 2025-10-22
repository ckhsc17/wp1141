#!/bin/bash

# 尋寶地圖應用 - 一鍵啟動腳本 (macOS/Linux)
# 作者: 尋寶地圖開發團隊
# 版本: 1.0.0

set -e  # 遇到錯誤時停止執行

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日誌函數
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 檢查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 檢查 Docker 是否安裝
check_docker() {
    log_step "檢查 Docker 安裝狀態..."
    
    if command_exists docker; then
        log_success "Docker 已安裝"
        docker --version
    else
        log_error "Docker 未安裝！"
        echo "請訪問 https://docs.docker.com/get-docker/ 安裝 Docker"
        
        # 嘗試自動安裝 Docker (macOS)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            log_info "檢測到 macOS，嘗試使用 Homebrew 安裝 Docker..."
            if command_exists brew; then
                brew install --cask docker
                log_warning "請手動啟動 Docker Desktop 應用程式，然後重新執行此腳本"
                exit 1
            else
                log_error "請先安裝 Homebrew 或手動安裝 Docker Desktop"
                exit 1
            fi
        else
            # Linux 自動安裝
            log_info "嘗試自動安裝 Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            log_warning "Docker 已安裝，請重新登入或執行 'newgrp docker' 然後重新執行此腳本"
            exit 1
        fi
    fi
    
    # 檢查 Docker 是否運行
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker 未運行！請啟動 Docker 服務"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            log_info "在 macOS 上，請啟動 Docker Desktop 應用程式"
        else
            log_info "在 Linux 上，請執行: sudo systemctl start docker"
        fi
        exit 1
    fi
    
    log_success "Docker 運行正常"
}

# 檢查 Docker Compose 是否安裝
check_docker_compose() {
    log_step "檢查 Docker Compose 安裝狀態..."
    
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        log_success "Docker Compose 已安裝"
        if command_exists docker-compose; then
            docker-compose --version
        else
            docker compose version
        fi
    else
        log_error "Docker Compose 未安裝！"
        
        # 嘗試自動安裝
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command_exists brew; then
                brew install docker-compose
            else
                log_error "請安裝 Homebrew 或手動安裝 Docker Compose"
                exit 1
            fi
        else
            # Linux 安裝
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        log_success "Docker Compose 安裝完成"
    fi
}

# 檢查 Node.js 是否安裝
check_nodejs() {
    log_step "檢查 Node.js 安裝狀態..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        log_success "Node.js 已安裝: $NODE_VERSION"
        
        # 檢查版本是否符合要求 (>=18)
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
            log_warning "Node.js 版本過舊 ($NODE_VERSION)，建議升級到 18+ 版本"
        fi
    else
        log_error "Node.js 未安裝！"
        
        # 嘗試自動安裝
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command_exists brew; then
                log_info "使用 Homebrew 安裝 Node.js..."
                brew install node
            else
                log_error "請安裝 Homebrew 或手動安裝 Node.js"
                exit 1
            fi
        else
            # Linux 安裝 (使用 NodeSource)
            log_info "安裝 Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        log_success "Node.js 安裝完成"
    fi
    
    # 檢查 npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_success "npm 已安裝: $NPM_VERSION"
    else
        log_error "npm 未安裝！請重新安裝 Node.js"
        exit 1
    fi
}

# 啟動 Docker 服務
start_docker_services() {
    log_step "啟動 Docker 服務..."
    
    # 檢查是否有 docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        log_error "找不到 docker-compose.yml 文件！"
        exit 1
    fi
    
    # 停止可能存在的舊容器
    log_info "停止舊的 Docker 容器..."
    if command_exists docker-compose; then
        docker-compose down 2>/dev/null || true
    else
        docker compose down 2>/dev/null || true
    fi
    
    # 啟動服務
    log_info "啟動 PostgreSQL、pgAdmin 和 Redis 服務..."
    if command_exists docker-compose; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    # 等待資料庫啟動
    log_info "等待 PostgreSQL 啟動..."
    sleep 5
    
    # 檢查資料庫健康狀態
    for i in {1..30}; do
        if docker exec treasure-map-db pg_isready -U treasure_user -d treasure_map >/dev/null 2>&1; then
            log_success "PostgreSQL 已就緒"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "PostgreSQL 啟動超時"
            exit 1
        fi
        
        log_info "等待 PostgreSQL 啟動... ($i/30)"
        sleep 2
    done
}

# 安裝後端依賴
install_backend_dependencies() {
    log_step "安裝後端依賴..."
    
    cd backend
    
    if [ ! -f "package.json" ]; then
        log_error "找不到後端 package.json 文件！"
        exit 1
    fi
    
    log_info "安裝 npm 套件..."
    npm install
    
    log_success "後端依賴安裝完成"
    cd ..
}

# 安裝前端依賴
install_frontend_dependencies() {
    log_step "安裝前端依賴..."
    
    cd frontend
    
    if [ ! -f "package.json" ]; then
        log_error "找不到前端 package.json 文件！"
        exit 1
    fi
    
    log_info "安裝 npm 套件..."
    npm install
    
    log_success "前端依賴安裝完成"
    cd ..
}

# 設置 Prisma
setup_prisma() {
    log_step "設置 Prisma..."
    
    cd backend
    
    # 檢查 .env 文件
    if [ ! -f ".env" ]; then
        log_warning "找不到 .env 文件，創建預設配置..."
        cat > .env << EOF
# 資料庫配置
DATABASE_URL="postgresql://treasure_user:treasure_password@localhost:5432/treasure_map"

# JWT 密鑰 (請在生產環境中更改)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-change-this-in-production"

# Google OAuth 配置 (請填入您的 Google OAuth 憑證)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"

# 應用配置
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# 檔案上傳配置
UPLOAD_DIR="uploads"
MAX_FILE_SIZE="10485760"
EOF
        log_success "已創建預設 .env 文件"
    fi
    
    # 生成 Prisma 客戶端
    log_info "生成 Prisma 客戶端..."
    npm run db:generate
    
    # 推送資料庫結構
    log_info "推送資料庫結構..."
    npm run db:push
    
    # 執行種子資料
    log_info "執行資料庫種子..."
    npm run db:seed
    
    log_success "Prisma 設置完成"
    cd ..
}

# 設置前端環境
setup_frontend_env() {
    log_step "設置前端環境..."
    
    cd frontend
    
    # 檢查 .env.local 文件
    if [ ! -f ".env.local" ]; then
        log_warning "找不到 .env.local 文件，創建預設配置..."
        cat > .env.local << EOF
# API 配置
NEXT_PUBLIC_API_URL=http://localhost:3001

# Google Maps API 金鑰 (請填入您的 Google Maps API 金鑰)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Google OAuth 配置
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EOF
        log_success "已創建預設 .env.local 文件"
        log_warning "請記得填入您的 Google Maps API 金鑰和 Google OAuth 設定"
    fi
    
    cd ..
}

# 啟動應用服務
start_application() {
    log_step "啟動應用服務..."
    
    # 創建日誌目錄
    mkdir -p logs
    
    # 啟動後端
    log_info "啟動後端服務..."
    cd backend
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    cd ..
    
    # 等待後端啟動
    log_info "等待後端服務啟動..."
    sleep 5
    
    # 檢查後端是否啟動成功
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        log_success "後端服務啟動成功 (PID: $BACKEND_PID)"
    else
        log_warning "後端服務可能需要更多時間啟動，請檢查日誌: logs/backend.log"
    fi
    
    # 啟動前端
    log_info "啟動前端服務..."
    cd frontend
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    cd ..
    
    log_success "前端服務啟動成功 (PID: $FRONTEND_PID)"
}

# 顯示啟動資訊
show_startup_info() {
    echo ""
    echo -e "${GREEN}🎉 尋寶地圖應用啟動完成！${NC}"
    echo ""
    echo -e "${CYAN}📱 前端應用:${NC} http://localhost:3000"
    echo -e "${CYAN}🔧 後端 API:${NC} http://localhost:3001"
    echo -e "${CYAN}📊 API 文檔:${NC} http://localhost:3001/api-docs"
    echo -e "${CYAN}🗄️  資料庫管理:${NC} http://localhost:8080 (pgAdmin)"
    echo ""
    echo -e "${YELLOW}📋 預設登入資訊:${NC}"
    echo -e "  pgAdmin: admin@treasure-map.com / admin123"
    echo ""
    echo -e "${YELLOW}📝 重要提醒:${NC}"
    echo -e "  1. 請填入 Google Maps API 金鑰到 frontend/.env.local"
    echo -e "  2. 請設定 Google OAuth 憑證到 backend/.env"
    echo -e "  3. 日誌文件位於 logs/ 目錄"
    echo ""
    echo -e "${BLUE}🛑 停止服務:${NC} 執行 ./stop.sh 或按 Ctrl+C"
    echo ""
}

# 主函數
main() {
    echo -e "${PURPLE}"
    echo "=================================="
    echo "   🗺️  尋寶地圖應用 - 一鍵啟動"
    echo "=================================="
    echo -e "${NC}"
    
    # 檢查是否在正確的目錄
    if [ ! -f "docker-compose.yml" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        log_error "請在項目根目錄執行此腳本！"
        exit 1
    fi
    
    # 執行各個步驟
    check_docker
    check_docker_compose
    check_nodejs
    start_docker_services
    install_backend_dependencies
    install_frontend_dependencies
    setup_prisma
    setup_frontend_env
    start_application
    show_startup_info
    
    # 保持腳本運行
    log_info "按 Ctrl+C 停止所有服務"
    
    # 設置信號處理
    trap 'log_info "正在停止服務..."; ./stop.sh 2>/dev/null || true; exit 0' INT TERM
    
    # 等待用戶中斷
    while true; do
        sleep 1
    done
}

# 執行主函數
main "$@"
