import { useState, useCallback } from 'react';
import { UseGeolocationResult, MapLocation } from '@/types';
import { ERROR_MESSAGES } from '@/utils/constants';

export const useGeolocation = (): UseGeolocationResult => {
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback((): Promise<MapLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = ERROR_MESSAGES.LOCATION_UNAVAILABLE;
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: MapLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setLocation(newLocation);
          setLoading(false);
          resolve(newLocation);
        },
        (error) => {
          let errorMessage: string;
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = ERROR_MESSAGES.LOCATION_DENIED;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = ERROR_MESSAGES.LOCATION_UNAVAILABLE;
              break;
            case error.TIMEOUT:
              errorMessage = ERROR_MESSAGES.LOCATION_TIMEOUT;
              break;
            default:
              errorMessage = ERROR_MESSAGES.LOCATION_UNAVAILABLE;
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 分鐘快取
        }
      );
    });
  }, []);

  return {
    location,
    error,
    loading,
    getCurrentLocation
  };
};