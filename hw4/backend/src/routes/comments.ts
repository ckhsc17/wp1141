import { Router } from 'express';
import {
  validateCreateComment,
  validateUpdateComment,
  validateUUIDParam
} from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management endpoints
 */

// TODO: Implement comment endpoints
// POST /api/treasures/:treasureId/comments - Create comment
// PUT /api/comments/:id - Update comment
// DELETE /api/comments/:id - Delete comment

export default router;