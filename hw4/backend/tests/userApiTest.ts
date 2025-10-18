/**
 * 用戶管理系統測試腳本
 * 
 * 這個腳本演示如何使用新實現的用戶管理 API
 * 包括認證、獲取用戶資料、統計資訊等功能
 */

const API_BASE_URL = 'http://localhost:5000/api';

// 測試數據
const testUser = {
  email: 'testuser@example.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

class UserAPITester {
  private authToken: string = '';

  /**
   * 註冊測試用戶
   */
  async registerUser() {
    console.log('🔄 註冊測試用戶...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser),
      });

      const result = await response.json();
      
      if (result.success) {
        this.authToken = result.data.token;
        console.log('✅ 用戶註冊成功');
        console.log(`📧 Email: ${testUser.email}`);
        console.log(`🔑 Token: ${this.authToken.substring(0, 20)}...`);
      } else {
        console.log('❌ 註冊失敗:', result.error);
        // 如果用戶已存在，嘗試登入
        if (result.error?.includes('already exists')) {
          await this.loginUser();
        }
      }
    } catch (error) {
      console.error('❌ 註冊請求失敗:', error);
    }
  }

  /**
   * 登入用戶
   */
  async loginUser() {
    console.log('🔄 用戶登入...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.authToken = result.data.token;
        console.log('✅ 用戶登入成功');
        console.log(`🔑 Token: ${this.authToken.substring(0, 20)}...`);
      } else {
        console.log('❌ 登入失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ 登入請求失敗:', error);
    }
  }

  /**
   * 獲取當前用戶檔案
   */
  async getCurrentUserProfile() {
    console.log('🔄 獲取當前用戶檔案...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 用戶檔案獲取成功');
        console.log('👤 用戶資料:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('❌ 獲取檔案失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ 獲取檔案請求失敗:', error);
    }
  }

  /**
   * 更新用戶檔案
   */
  async updateUserProfile() {
    console.log('🔄 更新用戶檔案...');
    
    const updateData = {
      name: 'Updated Test User',
      avatar: 'https://example.com/avatar.jpg'
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 用戶檔案更新成功');
        console.log('👤 更新後資料:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('❌ 更新檔案失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ 更新檔案請求失敗:', error);
    }
  }

  /**
   * 獲取用戶統計資訊
   */
  async getUserStats() {
    console.log('🔄 獲取用戶統計資訊...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 用戶統計獲取成功');
        console.log('📊 統計資料:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('❌ 獲取統計失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ 獲取統計請求失敗:', error);
    }
  }

  /**
   * 獲取用戶寶藏
   */
  async getUserTreasures() {
    console.log('🔄 獲取用戶寶藏...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/treasures?page=1&limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 用戶寶藏獲取成功');
        console.log(`💎 找到 ${result.data.treasures.length} 個寶藏`);
        console.log('📄 分頁資訊:', JSON.stringify(result.data.pagination, null, 2));
      } else {
        console.log('❌ 獲取寶藏失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ 獲取寶藏請求失敗:', error);
    }
  }

  /**
   * 獲取用戶收藏
   */
  async getUserFavorites() {
    console.log('🔄 獲取用戶收藏...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/favorites?page=1&limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 用戶收藏獲取成功');
        console.log(`❤️ 找到 ${result.data.favorites.length} 個收藏`);
        console.log('📄 分頁資訊:', JSON.stringify(result.data.pagination, null, 2));
      } else {
        console.log('❌ 獲取收藏失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ 獲取收藏請求失敗:', error);
    }
  }

  /**
   * 執行完整測試流程
   */
  async runFullTest() {
    console.log('🚀 開始用戶管理系統測試\n');

    // 1. 註冊或登入
    await this.registerUser();
    
    if (!this.authToken) {
      console.log('❌ 無法獲取認證 token，測試中止');
      return;
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 獲取用戶檔案
    await this.getCurrentUserProfile();
    
    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 更新用戶檔案
    await this.updateUserProfile();
    
    console.log('\n' + '='.repeat(50) + '\n');

    // 4. 獲取統計資訊
    await this.getUserStats();
    
    console.log('\n' + '='.repeat(50) + '\n');

    // 5. 獲取用戶寶藏
    await this.getUserTreasures();
    
    console.log('\n' + '='.repeat(50) + '\n');

    // 6. 獲取用戶收藏
    await this.getUserFavorites();

    console.log('\n🎉 用戶管理系統測試完成！');
  }
}

// 如果是 Node.js 環境，執行測試
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new UserAPITester();
  tester.runFullTest().catch(console.error);
}

// 如果是 browser 環境，提供全域函數
if (typeof window !== 'undefined') {
  (window as any).UserAPITester = UserAPITester;
  console.log('UserAPITester 已載入，你可以使用以下命令測試：');
  console.log('const tester = new UserAPITester(); tester.runFullTest();');
}

export default UserAPITester;