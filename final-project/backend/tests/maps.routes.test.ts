import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { gmapsClient } from '../src/lib/gmaps';

describe('Maps Routes', () => {
  // Mock Google Maps client by default (unless TEST_REAL_MAPS=true)
  if (process.env.TEST_REAL_MAPS !== 'true') {
    beforeAll(() => {
      // Mock geocode with status: OK
      vi.spyOn(gmapsClient, 'geocode').mockResolvedValue({
        data: {
          status: 'OK',
          results: [{
            formatted_address: 'Taipei 101, Taiwan',
            geometry: { location: { lat: 25.033, lng: 121.565 } },
            place_id: 'test123',
          }],
        },
      } as any);

      // Mock reverseGeocode with status: OK
      vi.spyOn(gmapsClient, 'reverseGeocode').mockResolvedValue({
        data: {
          status: 'OK',
          results: [{
            formatted_address: 'Taipei City, Taiwan',
            place_id: 'test456',
          }],
        },
      } as any);

      // Mock placesNearby with status: OK
      vi.spyOn(gmapsClient, 'placesNearby').mockResolvedValue({
        data: {
          status: 'OK',
          results: [{
            place_id: 'cafe1',
            name: 'Test Cafe',
            vicinity: 'Xinyi District',
            geometry: { location: { lat: 25.033, lng: 121.565 } },
            rating: 4.5,
            user_ratings_total: 100,
            types: ['cafe'],
          }],
        },
      } as any);

      // Mock directions with status: OK
      vi.spyOn(gmapsClient, 'directions').mockResolvedValue({
        data: {
          status: 'OK',
          routes: [{
            legs: [{
              duration: { text: '10 mins', value: 600 },
              distance: { text: '2 km', value: 2000 },
            }],
            overview_polyline: { points: 'test_polyline' },
          }],
        },
      } as any);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });
  }

  describe('GET /maps/geocode', () => {
    it('should return geocode results', async () => {
      const res = await request(app)
        .get('/maps/geocode')
        .query({ address: 'Taipei 101' });

      expect(res.status).toBe(200);
      expect(res.body.results).toBeDefined();
      expect(res.body.results[0]).toHaveProperty('formatted_address');
      expect(res.body.results[0]).toHaveProperty('geometry');
      expect(res.body).toHaveProperty('cached', false);
    });

    it('should return 422 for short address', async () => {
      const res = await request(app)
        .get('/maps/geocode')
        .query({ address: 'ab' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toBeDefined();
    });

    it('should use cache for repeated requests', async () => {
      const spy = vi.spyOn(gmapsClient, 'geocode');
      const uniqueAddress = `Test Address ${Date.now()}`;
      
      // First request
      const res1 = await request(app).get('/maps/geocode').query({ address: uniqueAddress });
      expect(res1.body.cached).toBe(false);

      // Second request (should be cached)
      const res2 = await request(app).get('/maps/geocode').query({ address: uniqueAddress });
      expect(res2.body.cached).toBe(true);

      // In mock mode, spy should only be called once
      if (process.env.TEST_REAL_MAPS !== 'true') {
        expect(spy).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('GET /maps/reverse', () => {
    it('should return reverse geocode results', async () => {
      const res = await request(app)
        .get('/maps/reverse')
        .query({ lat: 25.033, lng: 121.565 });

      expect(res.status).toBe(200);
      expect(res.body.results).toBeDefined();
      expect(res.body.results[0]).toHaveProperty('formatted_address');
      expect(res.body).toHaveProperty('cached', false);
    });

    it('should return 422 for invalid lat/lng', async () => {
      const res = await request(app)
        .get('/maps/reverse')
        .query({ lat: 100, lng: 200 });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should cache reverse geocode results', async () => {
      const uniqueLat = 25.033 + Math.random() * 0.001;
      const uniqueLng = 121.565 + Math.random() * 0.001;
      
      const res1 = await request(app).get('/maps/reverse').query({ lat: uniqueLat, lng: uniqueLng });
      const res2 = await request(app).get('/maps/reverse').query({ lat: uniqueLat, lng: uniqueLng });

      expect(res1.body.cached).toBe(false);
      expect(res2.body.cached).toBe(true);
    });
  });

  describe('GET /maps/nearby', () => {
    it('should return nearby places', async () => {
      const res = await request(app)
        .get('/maps/nearby')
        .query({ lat: 25.033, lng: 121.565, radius: 1500, type: 'cafe' });

      expect(res.status).toBe(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body).toHaveProperty('cached', false);
    });

    it('should return 422 for invalid radius', async () => {
      const res = await request(app)
        .get('/maps/nearby')
        .query({ lat: 25.033, lng: 121.565, radius: 50 });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should apply default radius if not provided', async () => {
      const res = await request(app)
        .get('/maps/nearby')
        .query({ lat: 25.033, lng: 121.565 });

      expect(res.status).toBe(200);
      // Default radius is 1500 (defined in schema)
    });
  });

  describe('POST /maps/directions', () => {
    it('should return directions', async () => {
      const res = await request(app)
        .post('/maps/directions')
        .send({
          origin: { lat: 25.033, lng: 121.565 },
          destination: { lat: 25.047, lng: 121.517 },
          mode: 'transit',
          departureTime: 'now',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('duration');
      expect(res.body).toHaveProperty('distance');
      expect(res.body).toHaveProperty('overview_polyline');
      expect(res.body).toHaveProperty('cached', false);
    });

    it('should return 422 for invalid mode', async () => {
      const res = await request(app)
        .post('/maps/directions')
        .send({
          origin: { lat: 25.033, lng: 121.565 },
          destination: { lat: 25.047, lng: 121.517 },
          mode: 'flying',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should cache directions results', async () => {
      const payload = {
        origin: { lat: 25.033 + Math.random() * 0.001, lng: 121.565 + Math.random() * 0.001 },
        destination: { lat: 25.047 + Math.random() * 0.001, lng: 121.517 + Math.random() * 0.001 },
        mode: 'transit' as const,
        departureTime: 'now' as const,
      };

      const res1 = await request(app).post('/maps/directions').send(payload);
      const res2 = await request(app).post('/maps/directions').send(payload);

      expect(res1.body.cached).toBe(false);
      expect(res2.body.cached).toBe(true);
    });

    it('should use default mode and departureTime', async () => {
      const res = await request(app)
        .post('/maps/directions')
        .send({
          origin: { lat: 25.033, lng: 121.565 },
          destination: { lat: 25.047, lng: 121.517 },
        });

      expect(res.status).toBe(200);
      // Default mode is 'transit', departureTime is 'now'
    });
  });

  describe('Rate Limiting', () => {
    it('should not enforce rate limits in test mode', async () => {
      // In test mode, rate limiter is disabled
      // Make multiple requests rapidly
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app).get('/maps/geocode').query({ address: `test${i}` })
        );
      }

      const results = await Promise.all(requests);
      
      // All should succeed (no 429)
      results.forEach(res => {
        expect(res.status).not.toBe(429);
      });
    });
  });
});

