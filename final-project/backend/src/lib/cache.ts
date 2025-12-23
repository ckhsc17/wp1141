import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

/**
 * Create an LRU cache with TTL
 * @param ttl Time-to-live in milliseconds (default: 5 minutes)
 */
export const createCache = <T extends {} = any>(ttl: number = 5 * 60 * 1000) => {
  return new LRUCache<string, T>({
    max: 500, // Maximum number of items
    ttl,      // Time-to-live per item
  });
};

/**
 * Generate a cache key from prefix and parameters using MD5 hash
 * @param prefix Cache key prefix (e.g., "geocode", "directions")
 * @param params Parameters object to hash
 * @returns Cache key in format "prefix:hash"
 */
export const makeCacheKey = (prefix: string, params: object): string => {
  // Normalize parameters by sorting keys
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash('md5').update(normalized).digest('hex');
  return `${prefix}:${hash}`;
};


