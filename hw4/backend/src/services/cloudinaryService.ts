import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// 配置 Cloudinary
cloudinary.config({
  cloud_name: 'da1mls4nt',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  /**
   * 上傳圖片到 Cloudinary
   * @param file - 檔案 buffer
   * @param folder - 上傳到的資料夾
   * @returns Cloudinary 上傳結果
   */
  static async uploadImage(file: Buffer, folder: string = 'treasures'): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      console.log('uploadImage', file);
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`圖片上傳失敗: ${error.message}`));
          } else if (result) {
            console.log('result', result);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes
            });
          } else {
            reject(new Error('圖片上傳失敗：未知錯誤'));
          }
        }
      );

      // 將 buffer 轉換為 stream
      const stream = new Readable();
      stream.push(file);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  /**
   * 上傳音檔到 Cloudinary
   * @param file - 檔案 buffer
   * @param folder - 上傳到的資料夾
   * @returns Cloudinary 上傳結果
   */
  static async uploadAudio(file: Buffer, folder: string = 'treasures'): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      console.log('=== Cloudinary uploadAudio Debug ===');
      console.log('file buffer size:', file.length);
      console.log('folder:', folder);
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'video', // Cloudinary 將音檔視為 video 類型
          transformation: [
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            reject(new Error(`音檔上傳失敗: ${error.message}`));
          } else if (result) {
            console.log('Cloudinary upload success:', {
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              bytes: result.bytes
            });
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              bytes: result.bytes
            });
          } else {
            console.error('Cloudinary upload: unknown error');
            reject(new Error('音檔上傳失敗：未知錯誤'));
          }
        }
      );

      // 將 buffer 轉換為 stream
      const stream = new Readable();
      stream.push(file);
      stream.push(null);
      stream.pipe(uploadStream);
      
      console.log('=====================================');
    });
  }

  /**
   * 刪除 Cloudinary 上的媒體
   * @param publicId - Cloudinary 公開 ID
   * @param resourceType - 資源類型 ('image' 或 'video')
   * @returns 刪除結果
   */
  static async deleteMedia(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      
      if (result.result === 'ok') {
        console.log(`成功刪除媒體: ${publicId}`);
        return true;
      } else {
        console.error(`刪除媒體失敗: ${publicId}`, result);
        return false;
      }
    } catch (error) {
      console.error('刪除媒體時發生錯誤:', error);
      return false;
    }
  }

  /**
   * 驗證圖片檔案
   * @param file - 檔案資訊
   * @returns 驗證結果
   */
  static validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
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
   * @param file - 檔案資訊
   * @returns 驗證結果
   */
  static validateAudioFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
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
