import ApiService from './apiService';
import { API_ENDPOINTS } from '@/utils/constants';
import { CommentDTO, CreateCommentRequest, CommentsResponse } from '@/types';

class CommentService extends ApiService {
  /**
   * 獲取寶藏的留言列表
   */
  async getCommentsByTreasureId(treasureId: string, page = 1, limit = 20): Promise<CommentsResponse> {
    try {
      const response = await this.get<{ data: CommentsResponse }>(
        `${API_ENDPOINTS.COMMENTS.GET_BY_TREASURE_ID(treasureId)}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * 創建新留言
   */
  async createComment(treasureId: string, commentData: CreateCommentRequest): Promise<CommentDTO> {
    try {
      const response = await this.post<{ data: CommentDTO }>(
        API_ENDPOINTS.COMMENTS.CREATE(treasureId),
        commentData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * 更新留言
   */
  async updateComment(commentId: string, content: string): Promise<CommentDTO> {
    try {
      const response = await this.put<{ data: CommentDTO }>(
        API_ENDPOINTS.COMMENTS.UPDATE(commentId),
        { content }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * 刪除留言
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      await this.delete(API_ENDPOINTS.COMMENTS.DELETE(commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * 獲取單個留言
   */
  async getCommentById(commentId: string): Promise<CommentDTO> {
    try {
      const response = await this.get<{ data: CommentDTO }>(
        API_ENDPOINTS.COMMENTS.GET_BY_ID(commentId)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching comment:', error);
      throw error;
    }
  }
}

export const commentService = new CommentService();
