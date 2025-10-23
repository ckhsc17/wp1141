import { apiService } from './apiService';
import { API_ENDPOINTS } from '@/utils/constants';

export interface UserStats {
  uploadedTreasures: number;
  favoritedTreasures: number;
  totalLikes: number;
  totalComments: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface UserTreasure {
  id: string;
  title: string;
  content: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  amount?: string;
  isPublic?: boolean;
  isHidden?: boolean;
  mediaUrl?: string;
  linkUrl?: string;
  isLiveLocation: boolean;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  createdAt: string;
}

class UserService {
  /**
   * 獲取當前用戶資料
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await apiService.get<{ success: boolean; data: UserProfile }>(API_ENDPOINTS.USERS.PROFILE);
      return response.data;
    } catch (error) {
      console.error('獲取用戶資料失敗:', error);
      throw new Error('無法獲取用戶資料');
    }
  }

  /**
   * 獲取用戶統計資料
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiService.get<{ success: boolean; data: UserStats }>(API_ENDPOINTS.USERS.STATS);
      return response.data;
    } catch (error) {
      console.error('獲取用戶統計失敗:', error);
      throw new Error('無法獲取統計資料');
    }
  }

  /**
   * 獲取用戶的寶藏列表
   */
  async getUserTreasures(page: number = 1, limit: number = 10): Promise<{
    treasures: UserTreasure[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          treasures: UserTreasure[];
          total: number;
          totalPages: number;
        };
      }>(`${API_ENDPOINTS.USERS.TREASURES}?page=${page}&limit=${limit}`);

      const { treasures, total, totalPages } = response.data;
      console.log('獲取用戶寶藏資料:', treasures);
      return {
        treasures,
        total,
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('獲取用戶寶藏失敗:', error);
      throw new Error('無法獲取寶藏列表');
    }
  }

  /**
   * 獲取用戶的收藏列表
   */
  async getUserFavorites(page: number = 1, limit: number = 10): Promise<{
    treasures: UserTreasure[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: {
          favorites: UserTreasure[];
          total: number;
          totalPages: number;
        };
      }>(`${API_ENDPOINTS.USERS.FAVORITES}?page=${page}&limit=${limit}`);

      const { favorites, total, totalPages } = response.data;
      return {
        treasures: favorites, // 將 favorites 映射為 treasures
        total,
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('獲取收藏列表失敗:', error);
      throw new Error('無法獲取收藏列表');
    }
  }

  /**
   * 更新用戶資料
   */
  async updateProfile(data: {
    name?: string;
    avatar?: string;
  }): Promise<UserProfile> {
    try {
      const response = await apiService.put<{ success: boolean; data: UserProfile }>(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
      return response.data;
    } catch (error) {
      console.error('更新用戶資料失敗:', error);
      throw new Error('無法更新用戶資料');
    }
  }

  /**
   * 上傳頭像
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiService.upload<{ success: boolean; data: { url: string } }>(API_ENDPOINTS.USERS.UPLOAD_AVATAR, formData);
      return response.data.url;
    } catch (error) {
      console.error('上傳頭像失敗:', error);
      throw new Error('無法上傳頭像');
    }
  }

  /**
   * 刪除帳號
   */
  async deleteAccount(): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.USERS.DELETE_ACCOUNT);
    } catch (error) {
      console.error('刪除帳號失敗:', error);
      throw new Error('無法刪除帳號');
    }
  }
}

export const userService = new UserService();