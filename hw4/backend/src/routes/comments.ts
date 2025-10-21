import { Router } from 'express';
import {
  createComment,
  getCommentsByTreasureId,
  getCommentById,
  updateComment,
  deleteComment
} from '../controllers/commentController';
import {
  validateCreateComment,
  validateUpdateComment,
  validateCUIDParam
} from '../middleware/validation';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management endpoints
 */

// Comment routes for specific treasures
router.post('/treasures/:treasureId/comments', 
  validateCUIDParam('treasureId'),
  authenticate,
  validateCreateComment,
  createComment
);

router.get('/treasures/:treasureId/comments',
  validateCUIDParam('treasureId'),
  optionalAuthenticate,
  getCommentsByTreasureId
);

// Individual comment routes
router.get('/comments/:commentId',
  validateCUIDParam('commentId'),
  optionalAuthenticate,
  getCommentById
);

router.put('/comments/:commentId',
  validateCUIDParam('commentId'),
  authenticate,
  validateUpdateComment,
  updateComment
);

router.delete('/comments/:commentId',
  validateCUIDParam('commentId'),
  authenticate,
  deleteComment
);

export default router;