import ApiService from './apiService';
import {
  TreasureDTO,
  TreasureDetailDTO,
  CreateTreasureRequest,
  UpdateTreasureRequest,
  TreasureQuery,
  CommentDTO,
  CreateCommentRequest,
  ApiResponse,
  PaginatedResponse
} from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

class TreasureService extends ApiService {
  // 取得寶藏列表
  async getTreasures(query?: TreasureQuery): Promise<PaginatedResponse<TreasureDTO>> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const url = `${API_ENDPOINTS.TREASURES.LIST}?${params.toString()}`;
    return await this.get<PaginatedResponse<TreasureDTO>>(url);
  }

  // 取得特定寶藏詳情
  async getTreasure(id: string): Promise<TreasureDetailDTO> {
    const response = await this.get<ApiResponse<TreasureDetailDTO>>(
      API_ENDPOINTS.TREASURES.DETAIL(id)
    );
    return response.data;
  }

  // 創建新寶藏
  async createTreasure(data: CreateTreasureRequest): Promise<TreasureDTO> {
    // 如果有媒體檔案，使用 FormData
    if (data.mediaFile) {
      const formData = new FormData();
      
      // 添加基本資料
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('type', data.type);
      formData.append('latitude', data.latitude.toString());
      formData.append('longitude', data.longitude.toString());
      
      if (data.address) {
        formData.append('address', data.address);
      }
      
      if (data.amount) {
        formData.append('amount', data.amount);
      }
      
      if (data.isPublic !== undefined) {
        formData.append('isPublic', data.isPublic.toString());
      }
      
      if (data.isHidden !== undefined) {
        formData.append('isHidden', data.isHidden.toString());
      }
      
      if (data.linkUrl && data.linkUrl !== null) {
        formData.append('linkUrl', data.linkUrl);
      }
      
      if (data.isLiveLocation) {
        formData.append('isLiveLocation', data.isLiveLocation.toString());
      }
      
      // 添加標籤
      data.tags.forEach(tag => {
        formData.append('tags', tag);
      });
      
      // 添加媒體檔案
      formData.append('mediaFile', data.mediaFile);

      console.log('創建寶藏請求資料 formData:', formData);

      const response = await this.upload<ApiResponse<TreasureDTO>>(
        API_ENDPOINTS.TREASURES.CREATE,
        formData
      );
      return response.data;
    } else {
      // 沒有媒體檔案，使用 JSON 格式
      const requestData = {
        title: data.title,
        content: data.content,
        type: data.type,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        amount: data.amount,
        isPublic: data.isPublic,
        isHidden: data.isHidden,
        linkUrl: data.linkUrl || null,
        isLiveLocation: data.isLiveLocation || false,
        tags: data.tags
      };

      console.log('創建寶藏請求資料 json:', requestData);

      const response = await this.post<ApiResponse<TreasureDTO>>(
        API_ENDPOINTS.TREASURES.CREATE,
        requestData
      );
      return response.data;
    }
  }

  // 更新寶藏
  async updateTreasure(id: string, data: UpdateTreasureRequest): Promise<TreasureDTO> {
    console.log('更新寶藏請求資料:', data);
    const response = await this.put<ApiResponse<TreasureDTO>>(
      API_ENDPOINTS.TREASURES.UPDATE(id),
      data
    );
    return response.data;
  }

  // 刪除寶藏
  async deleteTreasure(id: string): Promise<void> {
    await this.delete(API_ENDPOINTS.TREASURES.DELETE(id));
  }

  // 按讚/取消按讚
  async toggleLike(id: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const response = await this.post<ApiResponse<{ isLiked: boolean; likesCount: number }>>(
      API_ENDPOINTS.TREASURES.LIKE(id),
      {} // 傳送空物件作為 request body
    );
    console.log('toggleLike 響應:', response.data);
    return response.data;
  }

  // 收藏/取消收藏
  async toggleFavorite(id: string): Promise<{ isFavorited: boolean }> {
    const response = await this.post<ApiResponse<{ isFavorited: boolean }>>(
      API_ENDPOINTS.TREASURES.FAVORITE(id),
      {} // 傳送空物件作為 request body
    );
    console.log('收藏狀態:', response.data);
    return response.data;
  }

  // 取得寶藏留言
  async getComments(treasureId: string): Promise<CommentDTO[]> {
    const response = await this.get<ApiResponse<CommentDTO[]>>(
      API_ENDPOINTS.COMMENTS.GET_BY_TREASURE_ID(treasureId)
    );
    return response.data;
  }

  // 新增留言
  async createComment(treasureId: string, content: string): Promise<CommentDTO> {
    const request: CreateCommentRequest = { content };
    const response = await this.post<ApiResponse<CommentDTO>>(
      API_ENDPOINTS.COMMENTS.CREATE(treasureId),
      request
    );
    return response.data;
  }

  // 更新留言
  async updateComment(id: string, content: string): Promise<CommentDTO> {
    const request: CreateCommentRequest = { content };
    const response = await this.put<ApiResponse<CommentDTO>>(
      API_ENDPOINTS.COMMENTS.UPDATE(id),
      request
    );
    return response.data;
  }

  // 刪除留言
  async deleteComment(id: string): Promise<void> {
    await this.delete(API_ENDPOINTS.COMMENTS.DELETE(id));
  }
}

export const treasureService = new TreasureService();