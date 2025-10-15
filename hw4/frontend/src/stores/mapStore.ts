import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MapStore, MapLocation, MapBounds } from '@/types';
import { APP_CONFIG, STORAGE_KEYS } from '@/utils/constants';

export const useMapStore = create<MapStore>()(
  persist(
    (set) => ({
      center: APP_CONFIG.DEFAULT_MAP_CENTER,
      zoom: APP_CONFIG.DEFAULT_MAP_ZOOM,
      bounds: null,
      userLocation: null,

      setCenter: (center: MapLocation) => {
        set({ center });
      },

      setZoom: (zoom: number) => {
        set({ zoom });
      },

      setBounds: (bounds: MapBounds) => {
        set({ bounds });
      },

      setUserLocation: (location: MapLocation) => {
        set({ userLocation: location });
      }
    }),
    {
      name: STORAGE_KEYS.MAP_CENTER,
      partialize: (state) => ({
        center: state.center,
        zoom: state.zoom
      })
    }
  )
);