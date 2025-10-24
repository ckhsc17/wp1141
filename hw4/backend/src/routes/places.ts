import { Router } from 'express';
import { searchPlaces } from '../controllers/placesController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Places
 *   description: Place search and geocoding API
 */

/**
 * @swagger
 * /api/places/search:
 *   get:
 *     summary: Search for places by text query (e.g., location name, address)
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Text query for place search (e.g., '台北車站')
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: Latitude for biasing search results (optional)
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: Longitude for biasing search results (optional)
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Search radius in meters when latitude/longitude are provided (optional, default 50000m)
 *     responses:
 *       200:
 *         description: Place search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                           placeId:
 *                             type: string
 *       400:
 *         description: Invalid query parameter
 *       500:
 *         description: Internal server error
 */
router.get('/search', searchPlaces);

export default router;

