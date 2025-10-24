import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapLocation, MapBounds, TreasureMarker, TreasureType } from '@/types';
import { MAP_CONFIG } from '@/utils/constants';

interface UseGoogleMapsProps {
  center: MapLocation;
  zoom?: number;
  markers?: TreasureMarker[];
  onMarkerClick?: (marker: TreasureMarker) => void;
  onMapClick?: (location: MapLocation) => void;
  onBoundsChanged?: (bounds: MapBounds) => void;
}

interface UseGoogleMapsResult {
  mapRef: React.RefObject<HTMLDivElement | null>;
  mapInstance: google.maps.Map | null;
  isLoaded: boolean;
  error: string | null;
  addMarker: (marker: TreasureMarker) => void;
  removeMarker: (markerId: string) => void;
  clearMarkers: () => void;
  panTo: (location: MapLocation) => void;
  fitBounds: (bounds: MapBounds) => void;
}

export const useGoogleMaps = ({
  center,
  zoom = 12,
  markers = [],
  onMarkerClick,
  onMapClick,
  onBoundsChanged
}: UseGoogleMapsProps): UseGoogleMapsResult => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  // 初始化 Google Maps
  useEffect(() => {
    const initMap = async () => {
      console.log('init Map called');
      console.log('mapRef.current:', mapRef.current);
      
      if (!mapRef.current) {
        console.log('mapRef.current is null, skipping initialization');
        return;
      }
      
      console.log('mapRef is set, proceeding with initialization');

      try {
        console.log('開始載入 Google Maps API...');

        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'geometry'],
          region: 'TW', // 設置台灣地區
          language: 'zh-TW' // 設置繁體中文
        });

        // 等待 Google Maps API 載入
        console.log('載入 Google Maps API...');
        await loader.load();
        console.log('Google Maps API 載入完成');

        // 確保 DOM 元素仍然存在
        if (!mapRef.current) {
          console.log('mapRef.current became null during loading');
          return;
        }

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: MAP_CONFIG.STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative', // 根據官方建議
          backgroundColor: '#f5f5f5' // 載入時的背景色
        });

        console.log('地圖初始化完成');

        // 地圖點擊事件
        if (onMapClick) {
          map.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              onMapClick({
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
              });
            }
          });
        }

        // 地圖範圍變更事件
        if (onBoundsChanged) {
          map.addListener('bounds_changed', () => {
            const bounds = map.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              onBoundsChanged({
                north: ne.lat(),
                south: sw.lat(),
                east: ne.lng(),
                west: sw.lng()
              });
            }
          });
        }

        setMapInstance(map);
        setIsLoaded(true);
        console.log('地圖設置完成');
      } catch (err) {
        console.error('Google Maps loading error:', err);
        setError(`載入 Google Maps 失敗: ${err instanceof Error ? err.message : '未知錯誤'}`);
      }
    };

    // 使用 setTimeout 確保 DOM 已經渲染
    const timeoutId = setTimeout(initMap, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [center, zoom, onMapClick, onBoundsChanged]);

  // 創建標記圖標
  const createMarkerIcon = useCallback((type: TreasureType): google.maps.Icon => {
    const config = MAP_CONFIG.MARKER_ICONS[type];
    return {
      url: config.url,
      scaledSize: new google.maps.Size(config.scaledSize.width, config.scaledSize.height),
      anchor: new google.maps.Point(16, 32)
    };
  }, []);

  // 添加標記
  const addMarker = useCallback((markerData: TreasureMarker) => {
    if (!mapInstance) return;

    const marker = new google.maps.Marker({
      position: markerData.position,
      map: mapInstance,
      title: markerData.title,
      icon: createMarkerIcon(markerData.type),
      animation: google.maps.Animation.DROP
    });

    // 標記點擊事件
    if (onMarkerClick) {
      marker.addListener('click', () => {
        onMarkerClick(markerData);
      });
    }

    markersRef.current.set(markerData.id, marker);
  }, [mapInstance, createMarkerIcon, onMarkerClick]);

  // 移除標記
  const removeMarker = useCallback((markerId: string) => {
    const marker = markersRef.current.get(markerId);
    if (marker) {
      marker.setMap(null);
      markersRef.current.delete(markerId);
    }
  }, []);

  // 清除所有標記
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current.clear();
  }, []);

  // 移動地圖中心
  const panTo = useCallback((location: MapLocation) => {
    if (mapInstance) {
      mapInstance.panTo(location);
    }
  }, [mapInstance]);

  // 調整地圖範圍以顯示所有標記
  const fitBounds = useCallback((bounds: MapBounds) => {
    if (mapInstance) {
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      );
      mapInstance.fitBounds(googleBounds);
    }
  }, [mapInstance]);

  // 當標記列表更新時，重新渲染標記
  useEffect(() => {
    if (!mapInstance || !isLoaded) return;

    // 清除現有標記
    clearMarkers();

    // 添加新標記
    markers.forEach(marker => {
      addMarker(marker);
    });
  }, [markers, mapInstance, isLoaded, addMarker, clearMarkers]);

  // 當中心點變更時，移動地圖
  useEffect(() => {
    if (mapInstance) {
      panTo(center);
    }
  }, [center, mapInstance, panTo]);

  return {
    mapRef,
    mapInstance,
    isLoaded,
    error,
    addMarker,
    removeMarker,
    clearMarkers,
    panTo,
    fitBounds
  };
};