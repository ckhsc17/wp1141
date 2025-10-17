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
  validateUUIDParam
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
  validateUUIDParam('treasureId'),
  authenticate,
  validateCreateComment,
  createComment
);

router.get('/treasures/:treasureId/comments',
  validateUUIDParam('treasureId'),
  optionalAuthenticate,
  getCommentsByTreasureId
);

// Individual comment routes
router.get('/comments/:commentId',
  validateUUIDParam('commentId'),
  optionalAuthenticate,
  getCommentById
);

router.put('/comments/:commentId',
  validateUUIDParam('commentId'),
  authenticate,
  validateUpdateComment,
  updateComment
);

router.delete('/comments/:commentId',
  validateUUIDParam('commentId'),
  authenticate,
  deleteComment
);

export default router;