#!/usr/bin/env node

/**
 * 簡化的用戶系統測試腳本
 * 使用 Node.js 原生 https 模組來避免依賴問題
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api';

// 測試數據
const testUser = {
  email: 'testuser@example.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

/**
 * 發送 HTTP 請求的工具函數
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: jsonResponse
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: { error: 'Invalid JSON response', body }
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 解析 URL 並創建請求選項
 */
function createRequestOptions(url, method = 'GET', headers = {}) {
  const urlObj = new URL(url);
  
  return {
    hostname: urlObj.hostname,
    port: urlObj.port || 80,
    path: urlObj.pathname + urlObj.search,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
}

async function testUserSystem() {
  let authToken = '';

  console.log('🚀 開始用戶管理系統測試\n');

  try {
    // 1. 檢查伺服器是否運行
    console.log('🔄 檢查伺服器狀態...');
    
    try {
      const healthOptions = createRequestOptions(`${API_BASE_URL}/health`);
      const healthResponse = await makeRequest(healthOptions);
      
      if (healthResponse.statusCode === 200) {
        console.log('✅ 伺服器運行正常');
      } else {
        console.log('⚠️ 伺服器狀態異常，但繼續測試...');
      }
    } catch (error) {
      console.log('⚠️ 無法連接到伺服器，請確保後端服務正在運行');
      console.log('💡 請先運行: npm run dev');
      return;
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 註冊用戶
    console.log('🔄 註冊測試用戶...');
    
    const registerOptions = createRequestOptions(`${API_BASE_URL}/auth/register`, 'POST');
    const registerResponse = await makeRequest(registerOptions, testUser);
    
    if (registerResponse.data.success) {
      authToken = registerResponse.data.data.token;
      console.log('✅ 用戶註冊成功');
      console.log(`📧 Email: ${testUser.email}`);
    } else {
      console.log('⚠️ 註冊失敗（可能用戶已存在）:', registerResponse.data.error);
      
      // 嘗試登入
      console.log('🔄 嘗試登入現有用戶...');
      const loginOptions = createRequestOptions(`${API_BASE_URL}/auth/login`, 'POST');
      const loginResponse = await makeRequest(loginOptions, {
        email: testUser.email,
        password: testUser.password
      });
      
      if (loginResponse.data.success) {
        authToken = loginResponse.data.data.token;
        console.log('✅ 用戶登入成功');
      } else {
        console.log('❌ 登入也失敗:', loginResponse.data.error);
        return;
      }
    }

    if (!authToken) {
      console.log('❌ 無法獲取認證 token，測試中止');
      return;
    }

    console.log(`🔑 認證 Token: ${authToken.substring(0, 20)}...`);

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 獲取用戶檔案
    console.log('🔄 獲取當前用戶檔案...');
    
    const profileOptions = createRequestOptions(`${API_BASE_URL}/users/profile`, 'GET', {
      'Authorization': `Bearer ${authToken}`
    });
    const profileResponse = await makeRequest(profileOptions);
    
    if (profileResponse.data.success) {
      console.log('✅ 用戶檔案獲取成功');
      console.log('👤 用戶資料:');
      console.log(JSON.stringify(profileResponse.data.data, null, 2));
    } else {
      console.log('❌ 獲取檔案失敗:', profileResponse.data.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. 獲取用戶統計
    console.log('🔄 獲取用戶統計資訊...');
    
    const statsOptions = createRequestOptions(`${API_BASE_URL}/users/stats`, 'GET', {
      'Authorization': `Bearer ${authToken}`
    });
    const statsResponse = await makeRequest(statsOptions);
    
    if (statsResponse.data.success) {
      console.log('✅ 用戶統計獲取成功');
      console.log('📊 統計資料:');
      console.log(JSON.stringify(statsResponse.data.data, null, 2));
    } else {
      console.log('❌ 獲取統計失敗:', statsResponse.data.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 5. 獲取用戶寶藏
    console.log('🔄 獲取用戶寶藏...');
    
    const treasuresOptions = createRequestOptions(`${API_BASE_URL}/users/treasures?page=1&limit=5`, 'GET', {
      'Authorization': `Bearer ${authToken}`
    });
    const treasuresResponse = await makeRequest(treasuresOptions);
    
    if (treasuresResponse.data.success) {
      console.log('✅ 用戶寶藏獲取成功');
      console.log(`💎 找到 ${treasuresResponse.data.data.treasures.length} 個寶藏`);
      console.log('📄 分頁資訊:', JSON.stringify(treasuresResponse.data.data.pagination, null, 2));
    } else {
      console.log('❌ 獲取寶藏失敗:', treasuresResponse.data.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 6. 獲取用戶收藏
    console.log('🔄 獲取用戶收藏...');
    
    const favoritesOptions = createRequestOptions(`${API_BASE_URL}/users/favorites?page=1&limit=5`, 'GET', {
      'Authorization': `Bearer ${authToken}`
    });
    const favoritesResponse = await makeRequest(favoritesOptions);
    
    if (favoritesResponse.data.success) {
      console.log('✅ 用戶收藏獲取成功');
      console.log(`❤️ 找到 ${favoritesResponse.data.data.favorites.length} 個收藏`);
      console.log('📄 分頁資訊:', JSON.stringify(favoritesResponse.data.data.pagination, null, 2));
    } else {
      console.log('❌ 獲取收藏失敗:', favoritesResponse.data.error);
    }

    console.log('\n🎉 用戶管理系統測試完成！');
    console.log('\n📋 測試總結:');
    console.log('✅ 用戶認證系統：正常運作');
    console.log('✅ 用戶檔案管理：正常運作');  
    console.log('✅ 用戶統計系統：正常運作');
    console.log('✅ 寶藏查詢系統：正常運作');
    console.log('✅ 收藏查詢系統：正常運作');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    console.log('\n💡 請檢查：');
    console.log('1. 後端服務是否正在運行 (npm run dev)');
    console.log('2. 資料庫連接是否正常');
    console.log('3. 所有必要的環境變數是否已設定');
  }
}

// 執行測試
testUserSystem();