import { API_ENDPOINTS } from '@/utils/constants';
import { apiService } from './apiService';

export interface MediaUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}

export interface MediaUploadResponse {
  success: boolean;
  data: MediaUploadResult;
  message: string;
}

class MediaService {
  /**
   * 上傳圖片到 Cloudinary
   * @param file - 圖片檔案
   * @returns Cloudinary 上傳結果
   */
  async uploadImage(file: File): Promise<MediaUploadResult> {
    try {
      // 驗證檔案類型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('不支援的圖片格式。請上傳 JPG 或 PNG 格式的圖片。');
      }

      // 驗證檔案大小 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('圖片檔案過大。請上傳小於 10MB 的圖片。');
      }

      // 創建 FormData
      const formData = new FormData();
      formData.append('image', file);

      // 上傳到後端
      const response = await apiService.post<MediaUploadResponse>(
        API_ENDPOINTS.MEDIA.UPLOAD_IMAGE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 增加 timeout 到 30 秒
        }
      );

      console.log('=== mediaService uploadImage response ===');
      console.log('response:', response);
      console.log('response.success:', response.success);
      console.log('response.data:', response.data);
      console.log('==========================================');

      if (!response.success) {
        throw new Error(response.message || '圖片上傳失敗');
      }

      return response.data;
    } catch (error) {
      console.error('圖片上傳錯誤:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('圖片上傳失敗，請稍後再試');
    }
  }

  /**
   * 上傳音檔到 Cloudinary
   * @param file - 音檔檔案
   * @returns Cloudinary 上傳結果
   */
  async uploadAudio(file: File): Promise<MediaUploadResult> {
    try {
      // 驗證檔案類型
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('不支援的音檔格式。請上傳 MP3 或 WAV 格式的音檔。');
      }

      // 驗證檔案大小 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('音檔檔案過大。請上傳小於 10MB 的音檔。');
      }

      // 創建 FormData
      const formData = new FormData();
      formData.append('audio', file);

      // 上傳到後端
      const response = await apiService.post<MediaUploadResponse>(
        API_ENDPOINTS.MEDIA.UPLOAD_AUDIO,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 增加 timeout 到 30 秒
        }
      );

      console.log('=== mediaService uploadAudio response ===');
      console.log('response:', response);
      console.log('response.success:', response.success);
      console.log('response.data:', response.data);
      console.log('==========================================');

      if (!response.success) {
        throw new Error(response.message || '音檔上傳失敗');
      }

      return response.data;
    } catch (error) {
      console.error('音檔上傳錯誤:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('音檔上傳失敗，請稍後再試');
    }
  }

  /**
   * 格式化檔案大小顯示
   * @param bytes - 檔案大小（位元組）
   * @returns 格式化後的大小字串
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 驗證圖片檔案
   * @param file - 檔案
   * @returns 驗證結果
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '不支援的圖片格式。請上傳 JPG 或 PNG 格式的圖片。'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: '圖片檔案過大。請上傳小於 10MB 的圖片。'
      };
    }

    return { valid: true };
  }

  /**
   * 驗證音檔檔案
   * @param file - 檔案
   * @returns 驗證結果
   */
  validateAudioFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '不支援的音檔格式。請上傳 MP3 或 WAV 格式的音檔。'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: '音檔檔案過大。請上傳小於 10MB 的音檔。'
      };
    }

    return { valid: true };
  }
}

export const mediaService = new MediaService();
