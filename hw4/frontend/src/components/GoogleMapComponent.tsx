import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Center, Text, Card, ActionIcon } from '@mantine/core';
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
import { IconX, IconSparkles } from '@tabler/icons-react';
import { FaPuzzlePiece } from 'react-icons/fa';
import { TreasureMarker } from '@/types';
import { TreasureCardContent } from './TreasureCard';
import { LocationInfoWindow, getInfoWindowContainerStyle, getInfoWindowCardStyle, INFO_WINDOW_STYLES } from './InfoWindow';
import { useReverseGeocoding } from '@/hooks/useReverseGeocoding';

interface GoogleMapComponentProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  markers?: TreasureMarker[];
  currentLocation?: google.maps.LatLngLiteral | null;
  showCurrentLocation?: boolean;
  onMarkerClick?: (position: google.maps.LatLngLiteral) => void;
  onMapClick?: (position: google.maps.LatLngLiteral) => void;
  onLike?: (treasureId: string) => void;
  onFavorite?: (treasureId: string) => void;
  onComment?: (treasureId: string) => void;
  onCollect?: (treasureId: string) => void;
  onCommentsCountChange?: (treasureId: string, newCount: number) => void;
  onAddTreasureAtLocation?: (position: google.maps.LatLngLiteral, address?: string, mode?: 'treasure' | 'life_moment') => void;
  height?: string;
  width?: string;
}

// 寶藏資訊窗口組件
const TreasureInfoWindow: React.FC<{
  treasure: TreasureMarker;
  position: google.maps.LatLngLiteral;
  onClose: () => void;
  onLike?: (treasureId: string) => void;
  onFavorite?: (treasureId: string) => void;
  onComment?: (treasureId: string) => void;
  onCollect?: (treasureId: string) => void;
  onCommentsCountChange?: (treasureId: string, newCount: number) => void;
}> = ({ treasure, position, onClose, onLike, onFavorite, onComment, onCollect, onCommentsCountChange }) => {
  return (
    <AdvancedMarker
      position={position}
      clickable={false}
      zIndex={1000}
    >
      <div 
        style={getInfoWindowContainerStyle()}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          // 只有當點擊的目標不是 textarea, input, button，或者它們的子元素時，才阻止冒泡
          // 這樣可以確保 InfoWindow 內的交互元素能正常工作
          if (!target.closest('textarea') && !target.closest('input') && !target.closest('button') && !target.closest('.mantine-ActionIcon-root') && !target.closest('.mantine-Button-root')) {
            e.stopPropagation();
          }
        }}
      >
        {/* 資訊卡片 */}
        <Card
          shadow="lg"
          padding="md"
          radius="md"
          withBorder
          style={getInfoWindowCardStyle()}
        >
          {/* 箭頭邊框 */}
          <div style={INFO_WINDOW_STYLES.arrowBorder} />
          
          {/* 對話框箭頭 - 指向標記 */}
          <div style={INFO_WINDOW_STYLES.arrow} />


          {/* 關閉按鈕 */}
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            style={INFO_WINDOW_STYLES.closeButton}
          >
            <IconX size={16} />
          </ActionIcon>

          {/* 使用 TreasureCardContent 組件 */}
          <TreasureCardContent
            treasure={treasure.treasure}
            onLike={onLike}
            onFavorite={onFavorite}
            onComment={onComment}
            onCollect={onCollect}
            onCommentsCountChange={onCommentsCountChange}
            showOwnerMenu={false} // InfoWindow 中不顯示編輯/刪除選單
            compact={true} // 使用緊湊模式
            showComments={true} // 在 InfoWindow 中顯示留言區塊
          />
        </Card>
      </div>
    </AdvancedMarker>
  );
};

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

// 根據寶藏屬性選擇圖標
const getTreasureIcon = (treasure: TreasureMarker) => {
  const { isPublic, isHidden } = treasure.treasure;
  
  // isPublic = true：顯示「日常碎片」圖標
  if (isPublic === true) {
    return (
      <FaPuzzlePiece
        size={24} 
        color="#8B4513" 
        style={{
          filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))'
        }}
      />
    );
  }
  
  // isHidden = false：顯示寶箱圖標
  if (isHidden === false) {
    return (
      <GiOpenChest 
        size={24} 
        color="#8B4513" 
        style={{
          filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))'
        }}
      />
    );
  }
  
  // 默認情況：顯示寶箱圖標
  return (
    <GiOpenChest 
      size={24} 
      color="#8B4513" 
      style={{
        filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))'
      }}
    />
  );
};

// 寶藏標記組件
const TreasureMarkers: React.FC<{ 
  markers: TreasureMarker[];
  onMarkerClick?: (position: google.maps.LatLngLiteral) => void;
  onLike?: (treasureId: string) => void;
  onFavorite?: (treasureId: string) => void;
  onComment?: (treasureId: string) => void;
  onCollect?: (treasureId: string) => void;
  onCommentsCountChange?: (treasureId: string, newCount: number) => void;
  onCloseLocationInfo?: () => void;
}> = ({ 
  markers, 
  onMarkerClick,
  onLike,
  onFavorite,
  onComment,
  onCollect,
  onCommentsCountChange,
  onCloseLocationInfo
}) => {
  const map = useMap();
  const [markerInstances, setMarkerInstances] = useState<{[key: string]: Marker}>({});
  const [selectedTreasure, setSelectedTreasure] = useState<TreasureMarker | null>(null);
  const clusterer = useRef<MarkerClusterer | null>(null);

  // 當 markers 更新時，同步更新 selectedTreasure
  useEffect(() => {
    if (selectedTreasure) {
      const updatedTreasure = markers.find(marker => marker.id === selectedTreasure.id);
      if (updatedTreasure) {
        setSelectedTreasure(updatedTreasure);
      }
    }
  }, [markers, selectedTreasure]);

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
    
    // 關閉位置資訊窗口（如果有的話）
    if (onCloseLocationInfo) {
      onCloseLocationInfo();
    }
    
    // 設置選中的寶藏以顯示 InfoWindow
    setSelectedTreasure(marker);
    
    if (onMarkerClick) {
      onMarkerClick({ lat: marker.position.lat, lng: marker.position.lng });
    }
  }, [map, onMarkerClick, onCloseLocationInfo]);

  // 關閉 InfoWindow
  const handleCloseInfoWindow = useCallback(() => {
    setSelectedTreasure(null);
  }, []);

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
              backgroundColor: selectedTreasure?.id === treasureMarker.id ? '#FF6B35' : '#FFD700',
              border: `3px solid ${selectedTreasure?.id === treasureMarker.id ? '#FFD700' : '#FF6B35'}`,
              boxShadow: selectedTreasure?.id === treasureMarker.id 
                ? '0 6px 12px rgba(255, 107, 53, 0.4)' 
                : '0 4px 8px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: selectedTreasure?.id === treasureMarker.id ? 'scale(1.1)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (selectedTreasure?.id !== treasureMarker.id) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTreasure?.id !== treasureMarker.id) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }
            }}
          >
            {getTreasureIcon(treasureMarker)}
          </div>
        </AdvancedMarker>
      ))}
      
      {/* 顯示選中寶藏的 InfoWindow */}
      {selectedTreasure && (
        <TreasureInfoWindow
          treasure={selectedTreasure}
          position={{ 
            lat: selectedTreasure.position.lat, 
            lng: selectedTreasure.position.lng 
          }}
          onClose={handleCloseInfoWindow}
          onLike={onLike}
          onFavorite={onFavorite}
          onComment={onComment}
          onCollect={onCollect}
          onCommentsCountChange={onCommentsCountChange}
        />
      )}
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
  onLike,
  onFavorite,
  onComment,
  onCollect,
  onCommentsCountChange,
  onAddTreasureAtLocation,
  height = '400px',
  width = '100%'
}) => {
  // Location info state
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isLocationInfoOpen, setIsLocationInfoOpen] = useState(false);
  const { address, loading: addressLoading, error: addressError, getAddress, clearResult } = useReverseGeocoding();
  const [isApiLoaded, setIsApiLoaded] = useState(false); // 新增狀態來追蹤 API 載入狀態

  console.log('GoogleMapComponent 渲染中...', { 
    center, 
    zoom, 
    markersCount: markers.length,
    currentLocation,
    showCurrentLocation,
    selectedLocation
  });

  // 處理地圖點擊
  const handleMapClick = useCallback((ev: MapMouseEvent) => {
    console.log('地圖被點擊:', ev.detail.latLng);
    
    if (ev.detail.latLng) {
      const clickPosition = {
        lat: ev.detail.latLng.lat,
        lng: ev.detail.latLng.lng
      };
      
      // 如果當前有位置資訊窗口打開，先關閉它
      if (isLocationInfoOpen) {
        setSelectedLocation(null);
        setIsLocationInfoOpen(false);
        clearResult();
        return; // 不打開新的窗口，只是關閉當前的
      }
      
      // 打開新的位置資訊窗口
      setSelectedLocation(clickPosition);
      setIsLocationInfoOpen(true);
      getAddress(clickPosition.lat, clickPosition.lng);
      
      // Call original onMapClick callback if provided
      if (onMapClick) {
        onMapClick(clickPosition);
      }
    }
  }, [onMapClick, getAddress, isLocationInfoOpen, clearResult]);

  // 處理關閉位置資訊窗口
  const handleCloseLocationInfo = useCallback(() => {
    setSelectedLocation(null);
    setIsLocationInfoOpen(false);
    clearResult();
  }, [clearResult]);

  // 處理在指定位置新增寶藏
  const handleAddTreasureAtLocation = useCallback((position: google.maps.LatLngLiteral, mode: 'treasure' | 'life_moment') => {
    if (onAddTreasureAtLocation) {
      onAddTreasureAtLocation(position, address || undefined, mode);
    }
    // Close the location info window after handling
    handleCloseLocationInfo();
  }, [onAddTreasureAtLocation, handleCloseLocationInfo, address]);

  // 處理攝影機變更（使用節流避免過度觸發）
  const handleCameraChanged = useCallback((ev: MapCameraChangedEvent) => {
    // 只在 zoom 變化時記錄，避免拖拽時的頻繁 log
    if (ev.detail.zoom !== undefined) {
      console.log('地圖縮放變更:', {
        center: ev.detail.center,
        zoom: ev.detail.zoom
      });
    }
  }, []);

  return (
    <Box 
      style={{ 
        height, 
        width, 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <APIProvider 
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        version="weekly"
        libraries={['places', 'geometry']}
        region="TW" // 設置台灣地區
        language="zh-TW" // 設置繁體中文
        onLoad={() => {
          console.log('Google Maps API 已載入');
          setIsApiLoaded(true); // API 載入完成，設定狀態
        }}
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
          fullscreenControl={true}
          fullscreenControlOptions={isApiLoaded ? { position: google.maps.ControlPosition.BOTTOM_RIGHT } : undefined}
          mapTypeControl={true}
          mapTypeControlOptions={isApiLoaded ? { position: google.maps.ControlPosition.BOTTOM_RIGHT } : undefined}
          streetViewControl={false}
          zoomControl={true}
          zoomControlOptions={isApiLoaded ? { position: google.maps.ControlPosition.RIGHT_BOTTOM } : undefined}
        >
          <TreasureMarkers 
            markers={markers} 
            onMarkerClick={onMarkerClick}
            onLike={onLike}
            onFavorite={onFavorite}
            onComment={onComment}
            onCollect={onCollect}
            onCommentsCountChange={onCommentsCountChange}
            onCloseLocationInfo={handleCloseLocationInfo}
          />
          {showCurrentLocation && currentLocation && (
            <CurrentLocationMarker position={currentLocation} />
          )}
          
          {/* 顯示位置資訊窗口 */}
          {selectedLocation && isLocationInfoOpen && (
            <LocationInfoWindow
              position={selectedLocation}
              address={address}
              addressLoading={addressLoading}
              addressError={addressError}
              onClose={handleCloseLocationInfo}
              onAddTreasureHere={handleAddTreasureAtLocation}
            />
          )}
        </Map>
      </APIProvider>
    </Box>
  );
};

export default GoogleMapComponent;