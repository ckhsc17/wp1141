# Uploads Directory

This directory stores uploaded media files (images, audio, video).

Files are automatically organized and named by the upload middleware.

## Security Note
- Only authenticated users can upload files
- File types and sizes are validated
- Files are scanned for security before saving

## File Structure
```
uploads/
├── audio/
├── images/
└── videos/
```