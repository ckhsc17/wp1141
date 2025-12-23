import { Router, Request, Response } from 'express';
import { gmapsClient, GMAPS_KEY } from '../lib/gmaps';
import { createCache, makeCacheKey } from '../lib/cache';
import {
  geocodeQuerySchema,
  reverseQuerySchema,
  nearbyQuerySchema,
  directionsBodySchema,
} from '../schemas/maps';
import { z } from 'zod';

const router = Router();

// Create caches with 5-minute TTL
const geocodeCache = createCache<any>(5 * 60 * 1000);
const reverseCache = createCache<any>(5 * 60 * 1000);
const nearbyCache = createCache<any>(5 * 60 * 1000);
const directionsCache = createCache<any>(5 * 60 * 1000);

/**
 * @swagger
 * /maps/geocode:
 *   get:
 *     summary: Convert address to coordinates
 *     tags: [Maps]
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Address to geocode
 *         example: "台北101"
 *     responses:
 *       200:
 *         description: Geocoding results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       formatted_address:
 *                         type: string
 *                       geometry:
 *                         type: object
 *                         properties:
 *                           location:
 *                             type: object
 *                             properties:
 *                               lat:
 *                                 type: number
 *                               lng:
 *                                 type: number
 *                       place_id:
 *                         type: string
 *                 cached:
 *                   type: boolean
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /maps/geocode
 * Convert address to coordinates
 */
router.get('/geocode', async (req: Request, res: Response) => {
  try {
    const { address } = geocodeQuerySchema.parse(req.query);
    const cacheKey = makeCacheKey('geocode', { address });

    // Check cache
    const cached = geocodeCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Call Google API
    const response = await gmapsClient.geocode({
      params: { address, key: GMAPS_KEY },
    });

    const results = response.data.results.map((r: any) => ({
      formatted_address: r.formatted_address,
      geometry: {
        location: r.geometry.location,
      },
      place_id: r.place_id,
    }));

    const result = { results };
    geocodeCache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: error.errors,
      });
    }
    console.error('Geocode error:', error);
    res.status(500).json({
      code: 'GEOCODE_ERROR',
      message: 'Failed to geocode address',
    });
  }
});

/**
 * @swagger
 * /maps/reverse:
 *   get:
 *     summary: Convert coordinates to address
 *     tags: [Maps]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude
 *         example: 25.0339639
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude
 *         example: 121.5644722
 *     responses:
 *       200:
 *         description: Reverse geocoding results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                 cached:
 *                   type: boolean
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /maps/reverse
 * Convert coordinates to address
 */
router.get('/reverse', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = reverseQuerySchema.parse(req.query);
    const cacheKey = makeCacheKey('reverse', { lat, lng });

    const cached = reverseCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const response = await gmapsClient.reverseGeocode({
      params: { latlng: `${lat},${lng}`, key: GMAPS_KEY },
    });

    const results = response.data.results.map((r: any) => ({
      formatted_address: r.formatted_address,
      place_id: r.place_id,
    }));

    // 提取第一個結果作為主要地址
    const address = results.length > 0 ? results[0].formatted_address : null;

    const result = { address, results };
    reverseCache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: error.errors,
      });
    }
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      code: 'REVERSE_GEOCODE_ERROR',
      message: 'Failed to reverse geocode coordinates',
    });
  }
});

/**
 * @swagger
 * /maps/nearby:
 *   get:
 *     summary: Search for nearby places
 *     tags: [Maps]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude
 *         example: 25.0339639
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude
 *         example: 121.5644722
 *       - in: query
 *         name: radius
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 100
 *           maximum: 5000
 *           default: 1500
 *         description: Search radius in meters
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *         description: Place type (e.g., restaurant, cafe, hotel)
 *       - in: query
 *         name: keyword
 *         required: false
 *         schema:
 *           type: string
 *         description: Keyword for place search
 *     responses:
 *       200:
 *         description: Nearby places found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       place_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       vicinity:
 *                         type: string
 *                       location:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                           lng:
 *                             type: number
 *                       rating:
 *                         type: number
 *                       user_ratings_total:
 *                         type: integer
 *                       types:
 *                         type: array
 *                         items:
 *                           type: string
 *                 cached:
 *                   type: boolean
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius, type, keyword } = nearbyQuerySchema.parse(req.query);
    const cacheKey = makeCacheKey('nearby', { lat, lng, radius, type, keyword });

    const cached = nearbyCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const response = await gmapsClient.placesNearby({
      params: {
        location: `${lat},${lng}`,
        radius,
        type,
        keyword,
        key: GMAPS_KEY,
      },
    });

    const results = response.data.results.map((r: any) => ({
      place_id: r.place_id,
      name: r.name,
      vicinity: r.vicinity,
      location: r.geometry.location,
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      types: r.types,
    }));

    const result = { results };
    nearbyCache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: error.errors,
      });
    }
    console.error('Nearby search error:', error);
    res.status(500).json({
      code: 'NEARBY_SEARCH_ERROR',
      message: 'Failed to search nearby places',
    });
  }
});

/**
 * @swagger
 * /maps/directions:
 *   post:
 *     summary: Get directions between two points
 *     tags: [Maps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     format: float
 *                     example: 25.0339639
 *                   lng:
 *                     type: number
 *                     format: float
 *                     example: 121.5644722
 *               destination:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     format: float
 *                     example: 25.0349639
 *                   lng:
 *                     type: number
 *                     format: float
 *                     example: 121.5654722
 *               mode:
 *                 type: string
 *                 enum: [driving, walking, bicycling, transit]
 *                 default: transit
 *                 description: Travel mode
 *               departureTime:
 *                 type: string
 *                 oneOf:
 *                   - type: string
 *                     enum: [now]
 *                   - type: string
 *                     format: date-time
 *                 default: now
 *                 description: Departure time (ISO 8601 or 'now')
 *     responses:
 *       200:
 *         description: Directions calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 duration:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "15 分鐘"
 *                     value:
 *                       type: integer
 *                       example: 900
 *                 distance:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "2.5 km"
 *                     value:
 *                       type: integer
 *                       example: 2500
 *                 overview_polyline:
 *                   type: object
 *                   properties:
 *                     points:
 *                       type: string
 *                       description: Encoded polyline string for map rendering
 *                 cached:
 *                   type: boolean
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/directions', async (req: Request, res: Response) => {
  try {
    const { origin, destination, mode, departureTime } = directionsBodySchema.parse(req.body);
    const cacheKey = makeCacheKey('directions', { origin, destination, mode, departureTime });

    const cached = directionsCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const departure = departureTime === 'now' ? Date.now() / 1000 : new Date(departureTime).getTime() / 1000;

    const response = await gmapsClient.directions({
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode as any,
        departure_time: Math.floor(departure),
        key: GMAPS_KEY,
      },
    });

    const route = response.data.routes[0];
    const leg = route.legs[0];

    const result = {
      duration: leg.duration,
      distance: leg.distance,
      overview_polyline: route.overview_polyline,
    };

    directionsCache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: error.errors,
      });
    }
    console.error('Directions error:', error);
    res.status(500).json({
      code: 'DIRECTIONS_ERROR',
      message: 'Failed to get directions',
    });
  }
});

export default router;


