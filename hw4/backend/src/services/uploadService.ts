import fs from 'fs/promises';
import path from 'path';
import { ServiceResult, UploadedFile } from '../types';

export class UploadService {
  private readonly uploadDir = 'uploads';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'video/webm'
  ];

  constructor() {
    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['images', 'audio', 'videos', 'temp'];
    for (const subdir of subdirs) {
      const dirPath = path.join(this.uploadDir, subdir);
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
      }
    }
  }

  /**
   * Validate file
   */
  private validateFile(file: UploadedFile): ServiceResult<void> {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        success: false,
        error: `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`
      };
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return {
        success: false,
        error: 'File type not supported'
      };
    }

    return { success: true };
  }

  /**
   * Get file category from mime type
   */
  private getFileCategory(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.startsWith('video/')) return 'videos';
    return 'temp';
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const extension = path.extname(originalName);
    return `${timestamp}-${random}${extension}`;
  }

  /**
   * Upload file
   */
  async uploadFile(file: UploadedFile): Promise<ServiceResult<{ url: string; filename: string }>> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Determine file category and generate filename
      const category = this.getFileCategory(file.mimetype);
      const filename = this.generateFileName(file.originalname);
      const relativePath = path.join(category, filename);
      const fullPath = path.join(this.uploadDir, relativePath);

      // Move file from temp location to final location
      await fs.rename(file.path, fullPath);

      const url = `/${this.uploadDir}/${relativePath}`;

      return {
        success: true,
        data: {
          url,
          filename
        }
      };
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(file.path);
      } catch {
        // Ignore cleanup errors
      }

      return {
        success: false,
        error: 'Failed to upload file'
      };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filename: string): Promise<ServiceResult<void>> {
    try {
      // Find file in subdirectories
      const subdirs = ['images', 'audio', 'videos', 'temp'];
      let found = false;

      for (const subdir of subdirs) {
        const filePath = path.join(this.uploadDir, subdir, filename);
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          found = true;
          break;
        } catch {
          // File not in this directory, continue
        }
      }

      if (!found) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete file'
      };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filename: string): Promise<ServiceResult<{
    filename: string;
    size: number;
    mimetype: string;
    category: string;
  }>> {
    try {
      const subdirs = ['images', 'audio', 'videos', 'temp'];
      
      for (const subdir of subdirs) {
        const filePath = path.join(this.uploadDir, subdir, filename);
        try {
          const stats = await fs.stat(filePath);
          
          // Determine mimetype from extension
          const ext = path.extname(filename).toLowerCase();
          const mimetypeMap: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm'
          };

          return {
            success: true,
            data: {
              filename,
              size: stats.size,
              mimetype: mimetypeMap[ext] || 'application/octet-stream',
              category: subdir
            }
          };
        } catch {
          // File not in this directory, continue
        }
      }

      return {
        success: false,
        error: 'File not found'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get file info'
      };
    }
  }

  /**
   * Clean up temporary files older than 24 hours
   */
  async cleanupTempFiles(): Promise<ServiceResult<{ deletedCount: number }>> {
    try {
      const tempDir = path.join(this.uploadDir, 'temp');
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return {
        success: true,
        data: { deletedCount }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to cleanup temp files'
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<ServiceResult<{
    totalFiles: number;
    totalSize: number;
    categoryStats: { [category: string]: { count: number; size: number } };
  }>> {
    try {
      const subdirs = ['images', 'audio', 'videos', 'temp'];
      let totalFiles = 0;
      let totalSize = 0;
      const categoryStats: { [category: string]: { count: number; size: number } } = {};

      for (const subdir of subdirs) {
        const dirPath = path.join(this.uploadDir, subdir);
        let categoryCount = 0;
        let categorySize = 0;

        try {
          const files = await fs.readdir(dirPath);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);
            categoryCount++;
            categorySize += stats.size;
          }
        } catch {
          // Directory might not exist, skip
        }

        categoryStats[subdir] = {
          count: categoryCount,
          size: categorySize
        };

        totalFiles += categoryCount;
        totalSize += categorySize;
      }

      return {
        success: true,
        data: {
          totalFiles,
          totalSize,
          categoryStats
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get storage stats'
      };
    }
  }
}