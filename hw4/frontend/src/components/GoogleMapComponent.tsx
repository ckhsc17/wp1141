import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Center, Text } from '@mantine/core';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  useMap,
  MapCameraChangedEvent,
  MapMouseEvent
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';

interface TreasureMarker {
  key: string;
  location: google.maps.LatLngLiteral;
  title?: string;
}

interface GoogleMapComponentProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  markers?: TreasureMarker[];
  onMarkerClick?: (position: google.maps.LatLngLiteral) => void;
  onMapClick?: (position: google.maps.LatLngLiteral) => void;
  height?: string;
  width?: string;
}

// 寶藏標記組件
const TreasureMarkers: React.FC<{ markers: TreasureMarker[], onMarkerClick?: (position: google.maps.LatLngLiteral) => void }> = ({ 
  markers, 
  onMarkerClick 
}) => {
  const map = useMap();
  const [markerInstances, setMarkerInstances] = useState<{[key: string]: Marker}>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  // 初始化 MarkerClusterer
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // 更新標記叢集
  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markerInstances));
  }, [markerInstances]);

  // 處理標記點擊
  const handleMarkerClick = useCallback((ev: google.maps.MapMouseEvent, marker: TreasureMarker) => {
    if (!map) return;
    if (!ev.latLng) return;
    
    console.log('寶藏標記被點擊:', marker.title || marker.key);
    map.panTo(ev.latLng);
    
    if (onMarkerClick) {
      onMarkerClick(marker.location);
    }
  }, [map, onMarkerClick]);

  // 設定標記參照
  const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
    if (marker && markerInstances[key]) return;
    if (!marker && !markerInstances[key]) return;

    setMarkerInstances(prev => {
      if (marker) {
        return { ...prev, [key]: marker };
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  }, [markerInstances]);

  return (
    <>
      {markers.map((treasureMarker) => (
        <AdvancedMarker
          key={treasureMarker.key}
          position={treasureMarker.location}
          ref={marker => setMarkerRef(marker, treasureMarker.key)}
          clickable={true}
          onClick={(ev) => handleMarkerClick(ev, treasureMarker)}
        >
          <Pin 
            background={'#FFD700'} 
            glyphColor={'#8B4513'} 
            borderColor={'#FF6B35'}
            scale={1.2}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

// 主要地圖組件
const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center,
  zoom = 12,
  markers = [],
  onMarkerClick,
  onMapClick,
  height = '400px',
  width = '100%'
}) => {
  console.log('GoogleMapComponent 渲染中...', { center, zoom, markersCount: markers.length });

  // 處理地圖點擊
  const handleMapClick = useCallback((ev: MapMouseEvent) => {
    console.log('地圖被點擊:', ev.detail.latLng);
    
    if (onMapClick && ev.detail.latLng) {
      onMapClick({
        lat: ev.detail.latLng.lat,
        lng: ev.detail.latLng.lng
      });
    }
  }, [onMapClick]);

  // 處理攝影機變更
  const handleCameraChanged = useCallback((ev: MapCameraChangedEvent) => {
    console.log('攝影機變更:', {
      center: ev.detail.center,
      zoom: ev.detail.zoom
    });
  }, []);

  return (
    <Box 
      style={{ 
        height, 
        width, 
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '2px solid #FFD700',
        boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
      }}
    >
      <APIProvider 
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        version="weekly"
        libraries={['places', 'geometry']}
        region="TW" // 設置台灣地區
        language="zh-TW" // 設置繁體中文
        onLoad={() => console.log('Google Maps API 已載入')}
      >
        <Map
          defaultZoom={zoom}
          defaultCenter={center}
          mapId="DEMO_MAP_ID"
          onClick={handleMapClick}
          onCameraChanged={handleCameraChanged}
          style={{ height: '100%', width: '100%' }}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
        >
          <TreasureMarkers 
            markers={markers} 
            onMarkerClick={onMarkerClick} 
          />
        </Map>
      </APIProvider>
    </Box>
  );
};

export default GoogleMapComponent;