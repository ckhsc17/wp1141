import { Router } from 'express';
import {
  getTreasures,
  getTreasureById,
  createTreasure,
  updateTreasure,
  deleteTreasure,
  toggleLike,
  toggleFavorite,
  collectTreasure
} from '../controllers/treasureController';
import {
  validateCreateTreasure,
  validateUpdateTreasure,
  validateTreasureQuery,
  validateCUIDParam
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
router.get('/:id', validateCUIDParam('id'), optionalAuthenticate, getTreasureById);

// Protected routes
router.post('/', authenticate, validateCreateTreasure, createTreasure);
router.put('/:id', authenticate, validateUpdateTreasure, updateTreasure);
router.delete('/:id', authenticate, validateCUIDParam('id'), deleteTreasure);

// Like and favorite routes
router.post('/:id/like', authenticate, validateCUIDParam('id'), toggleLike);
router.post('/:id/favorite', authenticate, validateCUIDParam('id'), toggleFavorite);

// Collect route
router.post('/collect', authenticate, collectTreasure);

export default router;