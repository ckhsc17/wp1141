import { useState, useCallback, useRef } from 'react';

interface GeocodeResult {
  address: string | null;
  loading: boolean;
  error: string | null;
}

interface LocationCache {
  [key: string]: {
    address: string;
    timestamp: number;
  };
}

/**
 * Custom hook for reverse geocoding with caching and debouncing
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @param cacheExpiryMs - Cache expiry time in milliseconds (default: 5 minutes)
 */
export const useReverseGeocoding = (debounceMs = 300, cacheExpiryMs = 5 * 60 * 1000) => {
  const [result, setResult] = useState<GeocodeResult>({
    address: null,
    loading: false,
    error: null
  });

  const cacheRef = useRef<LocationCache>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Generate cache key from coordinates
   */
  const getCacheKey = useCallback((lat: number, lng: number): string => {
    // Round to 5 decimal places for caching (approximately 1 meter precision)
    const roundedLat = Math.round(lat * 100000) / 100000;
    const roundedLng = Math.round(lng * 100000) / 100000;
    return `${roundedLat},${roundedLng}`;
  }, []);

  /**
   * Check if cached result is still valid
   */
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < cacheExpiryMs;
  }, [cacheExpiryMs]);

  /**
   * Perform reverse geocoding using Google Maps Geocoding API
   */
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  }, []);

  /**
   * Get address for given coordinates with caching and debouncing
   */
  const getAddress = useCallback((lat: number, lng: number) => {
    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cacheKey = getCacheKey(lat, lng);
    const cached = cacheRef.current[cacheKey];

    // Return cached result if valid
    if (cached && isCacheValid(cached.timestamp)) {
      setResult({
        address: cached.address,
        loading: false,
        error: null
      });
      return;
    }

    // Set loading state
    setResult(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    // Debounce the geocoding request
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        abortControllerRef.current = new AbortController();
        
        const address = await reverseGeocode(lat, lng);
        
        // Cache the result
        cacheRef.current[cacheKey] = {
          address,
          timestamp: Date.now()
        };

        setResult({
          address,
          loading: false,
          error: null
        });
      } catch (error) {
        // Don't update state if request was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.warn('Reverse geocoding failed:', error);
        setResult({
          address: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, debounceMs);
  }, [debounceMs, getCacheKey, isCacheValid, reverseGeocode]);

  /**
   * Clear current result and cancel any pending requests
   */
  const clearResult = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setResult({
      address: null,
      loading: false,
      error: null
    });
  }, []);

  /**
   * Clear cache (useful for testing or memory management)
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    ...result,
    getAddress,
    clearResult,
    clearCache
  };
};
