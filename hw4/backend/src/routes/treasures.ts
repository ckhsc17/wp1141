import { Router } from 'express';
import {
  getTreasures,
  getTreasureById,
  createTreasure,
  updateTreasure,
  deleteTreasure
} from '../controllers/treasureController';
import {
  validateCreateTreasure,
  validateUpdateTreasure,
  validateTreasureQuery,
  validateUUIDParam
} from '../middleware/validation';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Treasures
 *   description: Treasure management endpoints
 */

// Public routes (with optional authentication)
router.get('/', validateTreasureQuery, optionalAuthenticate, getTreasures);
router.get('/:id', validateUUIDParam('id'), optionalAuthenticate, getTreasureById);

// Protected routes
router.post('/', authenticate, validateCreateTreasure, createTreasure);
router.put('/:id', authenticate, validateUpdateTreasure, updateTreasure);
router.delete('/:id', authenticate, validateUUIDParam('id'), deleteTreasure);

export default router;