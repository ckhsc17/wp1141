import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { uploadImage, uploadAudio, deleteMedia } from '../controllers/mediaController';

const router = Router();

// 配置 multer 使用 memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 限制
  }
});

// 圖片上傳路由
router.post('/upload/image', 
  authenticate, 
  upload.single('image'), 
  uploadImage
);

// 音檔上傳路由
router.post('/upload/audio', 
  authenticate, 
  upload.single('audio'), 
  uploadAudio
);

// 刪除媒體路由
router.delete('/delete/:publicId', 
  authenticate, 
  deleteMedia
);

export default router;
