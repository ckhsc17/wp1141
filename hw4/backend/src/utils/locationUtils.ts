/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
export const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Validate latitude value
 */
export const isValidLatitude = (lat: number): boolean => {
  return lat >= -90 && lat <= 90;
};

/**
 * Validate longitude value
 */
export const isValidLongitude = (lon: number): boolean => {
  return lon >= -180 && lon <= 180;
};

/**
 * Calculate bounding box for a given point and radius
 * @param lat Center latitude
 * @param lon Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export const getBoundingBox = (
  lat: number,
  lon: number,
  radiusKm: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} => {
  const R = 6371; // Earth's radius in km
  const latRadian = degreesToRadians(lat);
  
  // Calculate latitude bounds
  const latOffset = radiusKm / R;
  const north = lat + radiansToDegrees(latOffset);
  const south = lat - radiansToDegrees(latOffset);
  
  // Calculate longitude bounds (adjust for latitude)
  const lonOffset = Math.asin(Math.sin(latOffset) / Math.cos(latRadian));
  const east = lon + radiansToDegrees(lonOffset);
  const west = lon - radiansToDegrees(lonOffset);
  
  return {
    north: Math.min(90, north),
    south: Math.max(-90, south),
    east: east > 180 ? east - 360 : east,
    west: west < -180 ? west + 360 : west
  };
};

/**
 * Check if a point is within a given radius of another point
 */
export const isWithinRadius = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
};

/**
 * Find the center point of multiple coordinates
 */
export const getCenterPoint = (
  coordinates: Array<{ lat: number; lon: number }>
): { lat: number; lon: number } => {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate center of empty coordinates array');
  }

  if (coordinates.length === 1) {
    return { lat: coordinates[0].lat, lon: coordinates[0].lon };
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const coord of coordinates) {
    const latRad = degreesToRadians(coord.lat);
    const lonRad = degreesToRadians(coord.lon);

    x += Math.cos(latRad) * Math.cos(lonRad);
    y += Math.cos(latRad) * Math.sin(lonRad);
    z += Math.sin(latRad);
  }

  const total = coordinates.length;
  x = x / total;
  y = y / total;
  z = z / total;

  const centralLon = Math.atan2(y, x);
  const centralSquareRoot = Math.sqrt(x * x + y * y);
  const centralLat = Math.atan2(z, centralSquareRoot);

  return {
    lat: radiansToDegrees(centralLat),
    lon: radiansToDegrees(centralLon)
  };
};

/**
 * Generate random coordinates within a radius of a center point
 */
export const generateRandomCoordinatesInRadius = (
  centerLat: number,
  centerLon: number,
  radiusKm: number
): { lat: number; lon: number } => {
  const u = Math.random();
  const v = Math.random();
  const w = radiusKm / 6371; // Convert to radians

  const t = 2 * Math.PI * u;
  const u2 = 2 * v - 1;

  const x = Math.sqrt(1 - u2 * u2) * Math.cos(t);
  const y = Math.sqrt(1 - u2 * u2) * Math.sin(t);
  const z = u2;

  const newX = w * x;
  const newY = w * y;
  const newZ = w * z;

  const lat = Math.asin(newZ + Math.sin(degreesToRadians(centerLat)));
  const lon = Math.atan2(
    newY,
    Math.cos(degreesToRadians(centerLat)) - newZ * Math.sin(degreesToRadians(centerLat))
  ) + degreesToRadians(centerLon);

  return {
    lat: radiansToDegrees(lat),
    lon: radiansToDegrees(lon)
  };
};