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
import { GiTreasureMap, GiOpenChest } from 'react-icons/gi';
import { TreasureMarker } from '@/types';

interface GoogleMapComponentProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  markers?: TreasureMarker[];
  currentLocation?: google.maps.LatLngLiteral | null;
  showCurrentLocation?: boolean;
  onMarkerClick?: (position: google.maps.LatLngLiteral) => void;
  onMapClick?: (position: google.maps.LatLngLiteral) => void;
  height?: string;
  width?: string;
}

// 當前位置標記組件
const CurrentLocationMarker: React.FC<{ 
  position: google.maps.LatLngLiteral;
}> = ({ position }) => {
  return (
    <AdvancedMarker
      position={position}
      clickable={false}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#4285F4',
          border: '3px solid #ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          position: 'relative'
        }}
      >
        {/* 外圈動畫效果 */}
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(66, 133, 244, 0.3)',
            animation: 'locationPulse 2s infinite'
          }}
        />
      </div>
    </AdvancedMarker>
  );
};

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
    
    console.log('寶藏標記被點擊:', marker.title || marker.id);
    map.panTo(ev.latLng);
    
    if (onMarkerClick) {
      onMarkerClick({ lat: marker.position.lat, lng: marker.position.lng });
    }
  }, [map, onMarkerClick]);

  // 設定標記參照
  const setMarkerRef = useCallback((marker: Marker | null, id: string) => {
    if (marker && markerInstances[id]) return;
    if (!marker && !markerInstances[id]) return;

    setMarkerInstances(prev => {
      if (marker) {
        return { ...prev, [id]: marker };
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[id];
        return newMarkers;
      }
    });
  }, [markerInstances]);

  return (
    <>
      {markers.map((treasureMarker) => (
        <AdvancedMarker
          key={treasureMarker.id}
          position={{ lat: treasureMarker.position.lat, lng: treasureMarker.position.lng }}
          ref={marker => setMarkerRef(marker, treasureMarker.id)}
          clickable={true}
          onClick={(ev) => handleMarkerClick(ev, treasureMarker)}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FFD700',
              border: '3px solid #FF6B35',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
          >
            <GiTreasureMap 
              size={24} 
              color="#8B4513" 
              style={{
                filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))'
              }}
            />
          </div>
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
  currentLocation = null,
  showCurrentLocation = false,
  onMarkerClick,
  onMapClick,
  height = '400px',
  width = '100%'
}) => {
  console.log('GoogleMapComponent 渲染中...', { 
    center, 
    zoom, 
    markersCount: markers.length,
    currentLocation,
    showCurrentLocation
  });

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
          {showCurrentLocation && currentLocation && (
            <CurrentLocationMarker position={currentLocation} />
          )}
        </Map>
      </APIProvider>
    </Box>
  );
};

export default GoogleMapComponent;