import {
  calculateDistance,
  isValidLatitude,
  isValidLongitude,
  getBoundingBox,
  isWithinRadius,
  getCenterPoint,
  generateRandomCoordinatesInRadius
} from '../../src/utils/locationUtils';

describe('LocationUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Distance between New York and London
      const distance = calculateDistance(40.7128, -74.0060, 51.5074, -0.1278);
      
      // Allow some tolerance for floating point calculations
      expect(distance).toBeCloseTo(5570, -1); // Approximately 5570 km with 10km tolerance
    });

    it('should return 0 for same coordinates', () => {
      const lat = 25.0330;
      const lon = 121.5654;
      
      const distance = calculateDistance(lat, lon, lat, lon);
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-34.6037, -58.3816, 40.7128, -74.0060);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('isValidLatitude', () => {
    it('should validate correct latitude values', () => {
      expect(isValidLatitude(0)).toBe(true);
      expect(isValidLatitude(90)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
      expect(isValidLatitude(45.5)).toBe(true);
    });

    it('should reject invalid latitude values', () => {
      expect(isValidLatitude(91)).toBe(false);
      expect(isValidLatitude(-91)).toBe(false);
      expect(isValidLatitude(180)).toBe(false);
    });
  });

  describe('isValidLongitude', () => {
    it('should validate correct longitude values', () => {
      expect(isValidLongitude(0)).toBe(true);
      expect(isValidLongitude(180)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
      expect(isValidLongitude(121.5654)).toBe(true);
    });

    it('should reject invalid longitude values', () => {
      expect(isValidLongitude(181)).toBe(false);
      expect(isValidLongitude(-181)).toBe(false);
      expect(isValidLongitude(360)).toBe(false);
    });
  });

  describe('getBoundingBox', () => {
    it('should calculate bounding box correctly', () => {
      const lat = 25.0330;
      const lon = 121.5654;
      const radius = 10; // 10 km

      const boundingBox = getBoundingBox(lat, lon, radius);

      expect(boundingBox.north).toBeGreaterThan(lat);
      expect(boundingBox.south).toBeLessThan(lat);
      expect(boundingBox.east).toBeGreaterThan(lon);
      expect(boundingBox.west).toBeLessThan(lon);

      // Check bounds are within valid ranges
      expect(boundingBox.north).toBeLessThanOrEqual(90);
      expect(boundingBox.south).toBeGreaterThanOrEqual(-90);
    });

    it('should handle edge cases at poles', () => {
      const boundingBox = getBoundingBox(89, 0, 200);
      expect(boundingBox.north).toBe(90); // Clamped to maximum
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for points within radius', () => {
      const lat1 = 25.0330;
      const lon1 = 121.5654;
      const lat2 = 25.0340; // Very close point
      const lon2 = 121.5664;

      const result = isWithinRadius(lat1, lon1, lat2, lon2, 5); // 5 km radius
      expect(result).toBe(true);
    });

    it('should return false for points outside radius', () => {
      const lat1 = 25.0330;
      const lon1 = 121.5654;
      const lat2 = 26.0330; // ~111 km away
      const lon2 = 122.5654;

      const result = isWithinRadius(lat1, lon1, lat2, lon2, 50); // 50 km radius
      expect(result).toBe(false);
    });
  });

  describe('getCenterPoint', () => {
    it('should return the same point for single coordinate', () => {
      const coordinates = [{ lat: 25.0330, lon: 121.5654 }];
      const center = getCenterPoint(coordinates);

      expect(center.lat).toBe(25.0330);
      expect(center.lon).toBe(121.5654);
    });

    it('should calculate center point for multiple coordinates', () => {
      const coordinates = [
        { lat: 25.0330, lon: 121.5654 },
        { lat: 25.0430, lon: 121.5754 },
        { lat: 25.0230, lon: 121.5554 }
      ];

      const center = getCenterPoint(coordinates);

      // Center should be approximately the average
      expect(center.lat).toBeCloseTo(25.033, 2);
      expect(center.lon).toBeCloseTo(121.565, 2);
    });

    it('should throw error for empty coordinates array', () => {
      expect(() => getCenterPoint([])).toThrow('Cannot calculate center of empty coordinates array');
    });
  });

  describe('generateRandomCoordinatesInRadius', () => {
    it('should generate coordinates within specified radius', () => {
      const centerLat = 25.0330;
      const centerLon = 121.5654;
      const radius = 10; // 10 km

      for (let i = 0; i < 100; i++) {
        const randomCoords = generateRandomCoordinatesInRadius(centerLat, centerLon, radius);
        
        expect(isValidLatitude(randomCoords.lat)).toBe(true);
        expect(isValidLongitude(randomCoords.lon)).toBe(true);

        const distance = calculateDistance(centerLat, centerLon, randomCoords.lat, randomCoords.lon);
        expect(distance).toBeLessThanOrEqual(radius + 0.1); // Allow small tolerance
      }
    });

    it('should generate different coordinates on multiple calls', () => {
      const centerLat = 25.0330;
      const centerLon = 121.5654;
      const radius = 10;

      const coord1 = generateRandomCoordinatesInRadius(centerLat, centerLon, radius);
      const coord2 = generateRandomCoordinatesInRadius(centerLat, centerLon, radius);

      // Very unlikely to be exactly the same
      expect(coord1.lat === coord2.lat && coord1.lon === coord2.lon).toBe(false);
    });
  });
});