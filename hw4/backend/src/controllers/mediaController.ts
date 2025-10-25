import { Response, NextFunction } from 'express';
import { CloudinaryService } from '../services/cloudinaryService';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * /api/media/upload/image:
 *   post:
 *     summary: Upload image to Cloudinary
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG, max 10MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: Cloudinary URL
 *                     publicId:
 *                       type: string
 *                       description: Cloudinary public ID
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *                     format:
 *                       type: string
 *                     bytes:
 *                       type: number
 *       400:
 *         description: Invalid file or upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const uploadImage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: '請選擇要上傳的圖片'
        }
      });
      return;
    }

    // 驗證檔案
    const validation = CloudinaryService.validateImageFile(req.file);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: validation.error
        }
      });
      return;
    }

    // 上傳到 Cloudinary
    const result = await CloudinaryService.uploadImage(req.file.buffer, 'treasures');

    res.json({
      success: true,
      data: result,
      message: '圖片上傳成功'
    });
  } catch (error) {
    console.error('圖片上傳錯誤:', error);
    next(createError.internalServer('圖片上傳失敗'));
  }
};

/**
 * @swagger
 * /api/media/upload/audio:
 *   post:
 *     summary: Upload audio file to Cloudinary
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (MP3, WAV, max 10MB)
 *     responses:
 *       200:
 *         description: Audio uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: Cloudinary URL
 *                     publicId:
 *                       type: string
 *                       description: Cloudinary public ID
 *                     format:
 *                       type: string
 *                     bytes:
 *                       type: number
 *       400:
 *         description: Invalid file or upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const uploadAudio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: '請選擇要上傳的音檔'
        }
      });
      return;
    }

    // 驗證檔案
    const validation = CloudinaryService.validateAudioFile(req.file);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: validation.error
        }
      });
      return;
    }

    // 上傳到 Cloudinary
    const result = await CloudinaryService.uploadAudio(req.file.buffer, 'treasures');

    res.json({
      success: true,
      data: result,
      message: '音檔上傳成功'
    });
  } catch (error) {
    console.error('音檔上傳錯誤:', error);
    next(createError.internalServer('音檔上傳失敗'));
  }
};

/**
 * @swagger
 * /api/media/delete/{publicId}:
 *   delete:
 *     summary: Delete media from Cloudinary
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [image, video]
 *           default: image
 *         description: Resource type (image or video)
 *     responses:
 *       200:
 *         description: Media deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid public ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const deleteMedia = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    if (!publicId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PUBLIC_ID',
          message: '缺少媒體 ID'
        }
      });
      return;
    }

    const result = await CloudinaryService.deleteMedia(
      publicId, 
      resourceType as 'image' | 'video'
    );

    if (result) {
      res.json({
        success: true,
        message: '媒體刪除成功'
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: '媒體刪除失敗'
        }
      });
    }
  } catch (error) {
    console.error('媒體刪除錯誤:', error);
    next(createError.internalServer('媒體刪除失敗'));
  }
};
