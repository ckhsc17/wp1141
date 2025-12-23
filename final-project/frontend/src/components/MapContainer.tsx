import { useEffect, useRef, useState, memo } from 'react';
import { Box, Alert } from '@mui/material';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  id?: number;
  draggable?: boolean;
  label?: string;
  avatarUrl?: string;
  address?: string;
  status?: 'ongoing' | 'upcoming' | 'ended';
}

interface MapContainerProps {
  center?: { lat: number; lng: number };
  markers?: Array<MapMarker>;
  routes?: Array<{
    polyline: string;
    color: string;
    username: string;
  }>;
  showRoutes?: boolean;
  onMarkerDragEnd?: (id: number, lat: number, lng: number) => void;
  /** 是否全屏顯示（隱藏地圖控制項） */
  fullscreen?: boolean;
}

const DEFAULT_CENTER = { lat: 25.033, lng: 121.565 }; // 台北

// 生成圓形頭像 SVG marker
function createCircleMarkerIcon(label: string, color: string = '#2196f3'): string {
  const svg = `
    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="24" y="24" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
            fill="white" text-anchor="middle" dominant-baseline="central">
        ${label}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// 創建集合點 InfoWindow 內容
function createMeetingPointInfoContent(marker: MapMarker): string {
  return `
    <div style="padding: 8px; min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #0f172a;">
        ${marker.title}
      </h3>
      ${marker.address ? `
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">
          ${marker.address}
        </p>
      ` : ''}
      <button 
        id="navigate-btn-${marker.id}"
        style="
          width: 100%;
          padding: 10px 16px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        "
        onmouseover="this.style.backgroundColor='#1d4ed8'"
        onmouseout="this.style.backgroundColor='#2563eb'"
      >
        <span>🧭</span>
        <span>開始導航</span>
      </button>
    </div>
  `;
}

function MapContainer({ center = DEFAULT_CENTER, markers = [], routes = [], showRoutes = false, onMarkerDragEnd, fullscreen = false }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number | string, google.maps.Marker>>(new Map());
  const infoWindowsRef = useRef<Map<number | string, google.maps.InfoWindow>>(new Map());

  // 初始化地圖（只運行一次）
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_JS_KEY;

    if (!apiKey) {
      setError('Google Maps API key 未設定。請在 .env 檔案中設定 VITE_GOOGLE_MAPS_JS_KEY');
      return;
    }

    loadGoogleMaps()
      .then(() => {
        if (!mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: center || DEFAULT_CENTER,
          zoom: 13,
          // 全屏模式下隱藏所有控制項，避免與自定義 UI 重疊
          mapTypeControl: !fullscreen,
          streetViewControl: false,
          fullscreenControl: !fullscreen,
          zoomControl: !fullscreen,
          scaleControl: !fullscreen,
        });

        setMap(mapInstance);
      })
      .catch((err) => {
        console.error('Google Maps 載入失敗:', err);
        setError('Google Maps 載入失敗。請檢查 API key 是否有效。');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在組件掛載時初始化一次

  // 更新地圖中心點（不重新創建地圖）
  useEffect(() => {
    if (!map || !center) return;
    
    map.setCenter(center);
  }, [map, center]);

  // Add/update markers when map is ready or markers change
  useEffect(() => {
    if (!map) return;

    // 創建一個 Set 來追蹤當前應該存在的標記 ID
    const currentMarkerIds = new Set<number | string>();
    
    // 處理每個標記
    markers.forEach((marker) => {
      // 使用 id 或生成一個唯一 key（基於位置和標題）
      const markerId = marker.id !== undefined 
        ? marker.id 
        : `marker-${marker.lat}-${marker.lng}-${marker.title}`;
      
      currentMarkerIds.add(markerId);
      
      // 檢查標記是否已存在
      const existingMarker = markersRef.current.get(markerId);
      
      if (existingMarker) {
        // 更新現有標記的位置和標題
        const currentPos = existingMarker.getPosition();
        const newPos = new google.maps.LatLng(marker.lat, marker.lng);
        
        // 只有當位置改變時才更新
        if (!currentPos || currentPos.lat() !== marker.lat || currentPos.lng() !== marker.lng) {
          existingMarker.setPosition(newPos);
        }
        
        // 更新標題
        if (existingMarker.getTitle() !== marker.title) {
          existingMarker.setTitle(marker.title);
        }
      } else {
        // 創建新標記
        const markerOptions: google.maps.MarkerOptions = {
          position: { lat: marker.lat, lng: marker.lng },
          map,
          title: marker.title,
          draggable: marker.draggable || false,
        };

        // 如果有 avatarUrl，使用頭像圖片
        if (marker.avatarUrl) {
          markerOptions.icon = {
            url: marker.avatarUrl,
            scaledSize: new google.maps.Size(48, 48),
            anchor: new google.maps.Point(24, 24),
          };
        } else if (marker.label) {
          // 根據 label 和 status 決定顏色和樣式
          let color = '#2196f3'; // 默認藍色
          if (marker.label === '📍') {
            // 集合地點用更醒目的 pin 圖標
            // 如果是 ongoing，使用紅色並放大
            const isOngoing = marker.status === 'ongoing';
            markerOptions.icon = {
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: isOngoing ? '#ef4444' : '#3b82f6', // 紅色（ongoing）或藍色（upcoming）
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: isOngoing ? 3 : 2, // ongoing 用更粗的邊框
              scale: isOngoing ? 2.2 : 2, // ongoing 稍微放大
              anchor: new google.maps.Point(12, 22),
            };
          } else if (marker.label === '✅') {
            // 已到達用綠色
            color = '#4caf50';
            markerOptions.icon = {
              url: createCircleMarkerIcon('✓', color),
              scaledSize: new google.maps.Size(48, 48),
              anchor: new google.maps.Point(24, 24),
            };
          } else if (marker.label === '🔴') {
            // Ongoing 活動用紅色脈衝標記
            markerOptions.icon = {
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 2.2,
              anchor: new google.maps.Point(12, 22),
            };
          } else {
            // 其他成員用藍色圓形頭像
            markerOptions.icon = {
              url: createCircleMarkerIcon(marker.label, color),
              scaledSize: new google.maps.Size(48, 48),
              anchor: new google.maps.Point(24, 24),
            };
          }
        }

        const mapMarker = new google.maps.Marker(markerOptions);

        // Add drag end listener if marker is draggable and callback is provided
        if (marker.draggable && marker.id !== undefined && onMarkerDragEnd) {
          mapMarker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const newLat = event.latLng.lat();
              const newLng = event.latLng.lng();
              onMarkerDragEnd(marker.id!, newLat, newLng);
            }
          });
        }

        // 為集合點添加點擊事件和 InfoWindow
        if (marker.label === '📍') {
          const infoWindow = new google.maps.InfoWindow({
            content: createMeetingPointInfoContent(marker),
          });

          mapMarker.addListener('click', () => {
            // 關閉所有其他 InfoWindow
            infoWindowsRef.current.forEach((iw) => iw.close());
            // 打開當前 InfoWindow
            infoWindow.open(map, mapMarker);
          });

          // 當 InfoWindow 的 DOM 準備好時，添加導航按鈕的事件監聽器
          google.maps.event.addListener(infoWindow, 'domready', () => {
            const navBtn = document.getElementById(`navigate-btn-${marker.id}`);
            if (navBtn) {
              navBtn.addEventListener('click', () => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`;
                window.open(url, '_blank');
              });
            }
          });

          // 保存 InfoWindow 引用
          infoWindowsRef.current.set(markerId, infoWindow);
        }

        // 保存到 ref
        markersRef.current.set(markerId, mapMarker);
      }
    });

    // 移除不再存在的標記和 InfoWindow
    markersRef.current.forEach((marker, markerId) => {
      if (!currentMarkerIds.has(markerId)) {
        marker.setMap(null);
        markersRef.current.delete(markerId);
        
        // 同時清理對應的 InfoWindow
        const infoWindow = infoWindowsRef.current.get(markerId);
        if (infoWindow) {
          infoWindow.close();
          infoWindowsRef.current.delete(markerId);
        }
      }
    });
  }, [map, markers, onMarkerDragEnd]);

  // 組件卸載時清理所有 InfoWindow
  useEffect(() => {
    return () => {
      infoWindowsRef.current.forEach((infoWindow) => {
        infoWindow.close();
      });
      infoWindowsRef.current.clear();
    };
  }, []);

  // Add polyline routes when available
  useEffect(() => {
    if (!map || !showRoutes || routes.length === 0) return;

    const polylines: google.maps.Polyline[] = [];

    routes.forEach((route) => {
      const decodedPath = google.maps.geometry.encoding.decodePath(route.polyline);
      
      const polyline = new google.maps.Polyline({
        path: decodedPath,
        geodesic: true,
        strokeColor: route.color,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map
      });

      polylines.push(polyline);
    });

    // Cleanup
    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, routes, showRoutes]);

  if (error) {
    return (
      <Box sx={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      ref={mapRef}
      sx={{
        width: '100%',
        height: fullscreen ? '100%' : '500px',
        borderRadius: fullscreen ? 0 : 1,
        overflow: 'hidden',
      }}
    />
  );
}

// 使用 memo 優化，避免不必要的重新渲染
export default memo(MapContainer, (prevProps, nextProps) => {
  // 比較 center
  const centerEqual = 
    prevProps.center?.lat === nextProps.center?.lat &&
    prevProps.center?.lng === nextProps.center?.lng;

  // 比較 markers（淺比較，處理 undefined）
  const prevMarkers = prevProps.markers || [];
  const nextMarkers = nextProps.markers || [];
  
  const markersEqual = 
    prevMarkers.length === nextMarkers.length &&
    prevMarkers.every((marker, idx) => {
      const nextMarker = nextMarkers[idx];
      return (
        marker.lat === nextMarker.lat &&
        marker.lng === nextMarker.lng &&
        marker.title === nextMarker.title &&
        marker.label === nextMarker.label &&
        marker.address === nextMarker.address
      );
    });

  // 比較其他 props（處理 undefined）
  const prevRoutes = prevProps.routes || [];
  const nextRoutes = nextProps.routes || [];
  const routesEqual = prevRoutes.length === nextRoutes.length;
  const showRoutesEqual = prevProps.showRoutes === nextProps.showRoutes;

  return centerEqual && markersEqual && routesEqual && showRoutesEqual;
});

