-- 初始化資料庫腳本
-- 創建擴展功能

-- 啟用 PostGIS 擴展（用於地理位置查詢）
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 啟用全文搜索擴展
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 設定時區
SET timezone = 'Asia/Taipei';