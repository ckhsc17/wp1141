import ApiService from './apiService';
import { 
  LoginRequest, 
  LoginResponse, 
  UserDTO, 
  ApiResponse 
} from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

class AuthService extends ApiService {
  // Google OAuth 登入
  async login(googleToken: string): Promise<LoginResponse> {
    const request: LoginRequest = { googleToken };
    const response = await this.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.AUTH.LOGIN, 
      request
    );
    return response.data;
  }

  // 刷新 token
  async refreshToken(): Promise<LoginResponse> {
    const response = await this.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.AUTH.REFRESH
    );
    return response.data;
  }

  // 登出
  async logout(): Promise<void> {
    await this.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  // 取得當前使用者資訊
  async getCurrentUser(): Promise<UserDTO> {
    const response = await this.get<ApiResponse<UserDTO>>(
      API_ENDPOINTS.AUTH.ME
    );
    return response.data;
  }
}

export const authService = new AuthService();