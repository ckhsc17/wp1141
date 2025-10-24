'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppShell,
  Container,
  Group,
  Button,
  ActionIcon,
  Drawer,
  Stack,
  Text,
  Avatar,
  Menu,
  Modal,
  TextInput,
  Autocomplete
} from '@mantine/core';
import {
  IconPlus,
  IconFilter,
  IconMap,
  IconUser,
  IconSettings,
  IconLogout,
  IconList,
  IconMapPin,
  IconRefresh,
  IconHeart,
  IconSearch,
  IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import GoogleMapComponent from '@/components/GoogleMapComponent';
import TreasureForm from '@/components/TreasureForm';
import TreasureCard from '@/components/TreasureCard';
import TreasuresPage from '@/components/TreasuresPage';
import ProfileModal from '@/components/ProfileModal';
import LoginPage from '@/components/LoginPage';
import LocationSettingsModal from '@/components/LocationSettingsModal';
import SearchResultsSidebar from '@/components/SearchResultsSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTreasures } from '@/hooks/useTreasures';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { MapLocation, TreasureMarker, TreasureType, CreateTreasureRequest, TreasureDTO } from '@/types';
import { COLORS } from '@/utils/constants';
// 移除 placesService 引用，改用 Google Places API

interface PlaceSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

interface LocationTrackingSettings {
  updateInterval: number;
  minDistanceThreshold: number;
  enablePeriodicUpdate: boolean;
  enableDistanceTracking: boolean;
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [treasureFormOpened, { open: openTreasureForm, close: closeTreasureForm }] = useDisclosure(false);
  const [sidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false);
  const [treasuresPageOpened, { open: openTreasuresPage, close: closeTreasuresPage }] = useDisclosure(false);
  const [profileModalOpened, { open: openProfileModal, close: closeProfileModal }] = useDisclosure(false);
  const [locationSettingsOpened, { open: openLocationSettings, close: closeLocationSettings }] = useDisclosure(false);
  
  // 寶藏表單的預填數據
  const [treasureFormInitialData, setTreasureFormInitialData] = useState<Partial<CreateTreasureRequest> | undefined>(undefined);
  
  // 寶藏創建模式
  const [treasureCreationMode, setTreasureCreationMode] = useState<'treasure' | 'life_moment'>('treasure');
  
  // 搜尋相關狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<(PlaceSearchResult | TreasureDTO)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchSidebarOpened, setSearchSidebarOpened] = useState(false);
  
  // 預設地圖中心（台北101）
  const [mapCenter, setMapCenter] = useState<MapLocation>({
    lat: 25.0330,
    lng: 121.5654
  });

  const {
    treasures,
    loading: treasuresLoading,
    error: treasuresError,
    createTreasure,
    likeTreasure,
    favoriteTreasure,
    collectTreasure,
    deleteTreasure,
    refetch: refetchTreasures
  } = useTreasures({});

  // 位置追蹤設定狀態
  const [locationTrackingOptions, setLocationTrackingOptions] = useState({
    updateInterval: 60000, // 60秒定時更新（減少頻率）
    minDistanceThreshold: 200, // 移動200米觸發更新（增加閾值）
    enablePeriodicUpdate: true,
    enableDistanceTracking: true,
    enableHighAccuracy: false, // 關閉高精度以提高成功率
    timeout: 25000, // 增加超時時間
    maximumAge: 120000 // 允許使用2分鐘內的位置資料
  });

  // 位置更新回調（帶防抖優化）
  const lastTreasureRefetchRef = useRef<number>(0);
  const handleLocationUpdate = useCallback(async (location: MapLocation, distanceMoved: number) => {
    console.log(`位置更新: ${location.lat}, ${location.lng}, 移動距離: ${distanceMoved.toFixed(2)}m`);
    
    // 額外的防抖機制：避免過於頻繁的寶藏重新載入（最多每30秒一次）
    const now = Date.now();
    const timeSinceLastRefetch = now - lastTreasureRefetchRef.current;
    
    if (distanceMoved === 0 || (distanceMoved > 0 && timeSinceLastRefetch >= 30000)) {
      console.log('觸發寶藏重新載入');
      lastTreasureRefetchRef.current = now;
      
      try {
        await refetchTreasures();
        console.log('寶藏重新載入完成');
      } catch (error) {
        console.error('寶藏重新載入失敗:', error);
      }
      
      // 如果是首次獲取位置，將地圖中心移動到當前位置
      if (distanceMoved === 0) {
        setMapCenter(location);
      }
    } else if (distanceMoved > 0) {
      console.log(`跳過寶藏重新載入，距離上次載入僅 ${timeSinceLastRefetch}ms`);
    }
  }, [refetchTreasures]);

  // 使用位置追蹤 hook
  const {
    currentLocation,
    lastLocation,
    isTracking,
    error: locationError,
    loading: locationLoading,
    distanceMoved,
    startTracking,
    stopTracking,
    forceUpdate
  } = useLocationTracking(locationTrackingOptions, handleLocationUpdate);

  // 讀取搜尋歷史記錄
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('讀取搜尋歷史記錄失敗:', error);
      }
    }
  }, []);

  // 自動開始位置追蹤
  useEffect(() => {
    if (isAuthenticated && !isTracking) {
      console.log('用戶已登入，開始位置追蹤');
      startTracking();
    } else if (!isAuthenticated && isTracking) {
      console.log('用戶未登入，停止位置追蹤');
      stopTracking();
    }
  }, [isAuthenticated, isTracking]); // 移除 startTracking 和 stopTracking 依賴

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []); // 空依賴項，只在組件卸載時執行

  // 處理位置設定保存
  const handleLocationSettingsSave = useCallback((newSettings: typeof locationTrackingOptions) => {
    console.log('更新位置追蹤設定:', newSettings);
    setLocationTrackingOptions(newSettings);
    
    // 如果正在追蹤，重新啟動以應用新設定
    if (isTracking) {
      stopTracking();
      setTimeout(() => {
        startTracking();
      }, 1000);
    }
  }, [isTracking]); // 移除 stopTracking 和 startTracking 依賴

  // 處理搜尋歷史記錄保存
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10); // 限制最多10條記錄
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [searchHistory]);

  // 處理搜尋查詢變化
  const handleSearchQueryChange = useCallback((value: string) => {
    console.log('handleSearchQueryChange called');
    setSearchQuery(value);
    setShowSearchHistory(value === '');
  }, []);

  // 處理搜尋提交
  const handleSearchSubmit = useCallback(async (query: string) => {
    console.log('handleSearchSubmit called');
    if (!query.trim()) return;
    
    setIsSearching(true);
    saveSearchHistory(query);
    
    try {
      console.log('搜尋查詢:', query);
      
      // 同時進行 Google Places API 搜尋和寶藏搜尋
      const [placesResults, treasureResults] = await Promise.all([
        // Google Places API 搜尋地點
        new Promise<PlaceSearchResult[]>((resolve) => {
          if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.warn('Google Places API 未載入');
            resolve([]);
            return;
          }
          
          const service = new google.maps.places.PlacesService(document.createElement('div'));
          const request: google.maps.places.TextSearchRequest = {
            query: query,
            // 限制搜尋結果數量
            // maxResults: 10,
          };
          
          // 如果有當前位置，添加位置偏差
          if (currentLocation) {
            request.location = new google.maps.LatLng(currentLocation.lat, currentLocation.lng);
            request.radius = 50000; // 50km 半徑
          }
          
          service.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              const places: PlaceSearchResult[] = results.map(place => ({
                name: place.name || '',
                address: place.formatted_address || '',
                latitude: place.geometry?.location?.lat() || 0,
                longitude: place.geometry?.location?.lng() || 0,
                placeId: place.place_id || '',
              }));
              resolve(places);
            } else {
              console.error('Places API 搜尋失敗:', status);
              resolve([]);
            }
          });
        }),
        
        // 寶藏搜尋 - 直接對已載入的寶藏進行前端過濾（避免重新 API 呼叫）
        new Promise<TreasureDTO[]>((resolve) => {
          // 直接過濾已載入的寶藏，避免重新 API 呼叫
          const filteredTreasures = treasures.filter(treasure =>
            treasure.title.toLowerCase().includes(query.toLowerCase()) ||
            treasure.content.toLowerCase().includes(query.toLowerCase()) ||
            treasure.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
          ).slice(0, 10); // 限制寶藏搜尋結果數量為 10 筆
          resolve(filteredTreasures);
        })
      ]);
      
      console.log('地點搜尋結果:', placesResults);
      console.log('寶藏搜尋結果:', treasureResults);
      
      // 合併搜尋結果
      const combinedResults = [...placesResults, ...treasureResults];
      setSearchResults(combinedResults);
      
      // 打開搜尋結果側邊欄
      setSearchSidebarOpened(true);
      
    } catch (error) {
      console.error('搜尋失敗:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [saveSearchHistory, currentLocation, refetchTreasures, treasures]);

  // 處理搜尋歷史記錄點擊
  const handleSearchHistoryClick = useCallback((query: string) => {
    setSearchQuery(query);
    setShowSearchHistory(false);
    handleSearchSubmit(query);
  }, [handleSearchSubmit]);

  // 處理地點搜尋結果點擊
  const handlePlaceClick = useCallback((place: PlaceSearchResult) => {
    console.log('地點點擊:', place);
    // 將地圖中心移動到該地點
    setMapCenter({ lat: place.latitude, lng: place.longitude });
    // 關閉搜尋側邊欄
    setSearchSidebarOpened(false);
  }, []);

  // 處理寶藏搜尋結果點擊
  const handleTreasureClick = useCallback((treasure: TreasureDTO) => {
    console.log('寶藏點擊:', treasure);
    // 將地圖中心移動到該寶藏
    setMapCenter({ lat: treasure.latitude, lng: treasure.longitude });
    // 關閉搜尋側邊欄
    setSearchSidebarOpened(false);
    // TODO: 自動開啟該寶藏的 InfoWindow
  }, []);

  // 統一處理開啟創建表單的函數
  const handleOpenCreateForm = (
    mode: 'treasure' | 'life_moment',
    initialPosData?: { latitude: number; longitude: number; address?: string } // 將 address 改為可選
  ) => {
    setTreasureCreationMode(mode);
    setTreasureFormInitialData(initialPosData);
    openTreasureForm();
  };

  // 將寶藏資料轉換為地圖標記格式
  const treasureMarkersForMap: TreasureMarker[] = treasures.map(treasure => ({
    id: treasure.id,
    position: { lat: treasure.latitude, lng: treasure.longitude },
    type: treasure.type,
    title: treasure.title,
    treasure: treasure
  }));

  const handleMapClick = (location: MapLocation) => {
    console.log('地圖點擊:', location);
  };

  // 處理在指定位置新增寶藏
  const handleAddTreasureAtLocation = (position: google.maps.LatLngLiteral, address?: string, mode: 'treasure' | 'life_moment' = 'treasure') => {
    console.log('在位置新增寶藏:', position, '地址:', address, '模式:', mode);
    
    // 設置預填數據
    const initialData = {
      latitude: position.lat,
      longitude: position.lng,
      address: address || '地址不可用'
    };
    setTreasureFormInitialData(initialData);
    setTreasureCreationMode(mode);
    
    // 設置地圖中心到點擊位置
    setMapCenter(position);
    // 打開寶藏表單
    openTreasureForm();
  };

  const handleMarkerClick = (position: google.maps.LatLngLiteral) => {
    // 找到被點擊的寶藏
    const clickedTreasure = treasures.find(treasure => 
      Math.abs(treasure.latitude - position.lat) < 0.0001 && 
      Math.abs(treasure.longitude - position.lng) < 0.0001
    );
    
    if (clickedTreasure) {
      console.log('標記點擊 - 寶藏:', clickedTreasure.title);
      // 不再設置 selectedTreasure 和打開側邊欄
      // InfoWindow 會自動在地圖上顯示寶藏詳情
    }
  };

  // 處理寶藏表單提交
  const handleTreasureSubmit = async (data: CreateTreasureRequest) => {
    try {
      console.log('新增寶藏:', data);
      await createTreasure(data);
      await refetchTreasures();
      closeTreasureForm();
      setTreasureFormInitialData(undefined);
    } catch (error) {
      console.error('創建寶藏失敗:', error);
      alert('創建寶藏失敗，請稍後再試');
    }
  };

  // 處理按讚
  const handleLike = async (treasureId: string) => {
    try {
      await likeTreasure(treasureId);
    } catch (error) {
      console.error('按讚失敗:', error);
    }
  };

  // 處理收藏
  const handleFavorite = async (treasureId: string) => {
    try {
      await favoriteTreasure(treasureId);
    } catch (error) {
      console.error('收藏失敗:', error);
    }
  };

  // 處理收集寶藏
  const handleCollect = async (treasureId: string) => {
    console.log("handleCollect called")
    try {
      console.log('收集寶藏:', treasureId);
      await collectTreasure(treasureId);
    } catch (error) {
      console.error('收集寶藏失敗:', error);
    }
  };

  // 處理留言
  const handleComment = async (treasureId: string) => {
    try {
      console.log('留言寶藏:', treasureId);
      // 留言功能現在直接在 InfoWindow 中處理
    } catch (error) {
      console.error('留言失敗:', error);
    }
  };

  // 處理留言數量變化
  const handleCommentsCountChange = useCallback(async (treasureId: string, newCount: number) => {
    console.log(`寶藏 ${treasureId} 的留言數量變更為: ${newCount}`);
    // 重新載入寶藏資料以更新留言數量
    await refetchTreasures();
  }, [refetchTreasures]);

  // 處理刪除
  const handleDelete = async (treasureId: string) => {
    if (confirm('確定要刪除這個寶藏嗎？')) {
      try {
        await deleteTreasure(treasureId);
        await refetchTreasures();
      } catch (error) {
        console.error('刪除失敗:', error);
        alert('刪除失敗，請稍後再試');
      }
    }
  };

  // 如果正在載入認證狀態
  if (isLoading) {
    return (
      <Container size="xs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text>載入中...</Text>
      </Container>
    );
  }

  // 如果未登入，顯示登入頁面
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AppShell
      padding={0}
    >
      {/* 移除 AppShell.Header */}

      {/* 上方浮動按鈕 */}
      <Group
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 1000,
          gap: 'md',
        }}
      >
        {/* 搜尋欄 */}
        <TextInput
          placeholder="搜尋寶藏或地點..."
          style={{ width: '60%', maxWidth: '500px' }}
          value={searchQuery}
          onChange={(event) => {
            console.log('TextInput onChange called');
            handleSearchQueryChange(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              console.log('Enter key pressed, calling handleSearchSubmit');
              handleSearchSubmit(searchQuery);
            }
          }}
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchHistory(true);
                }}
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          radius="md"
        />
        
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpenCreateForm('treasure')}
          size="sm"
        >
          埋藏寶藏
        </Button>

        <Button
          leftSection={<IconHeart size={16} />}
          onClick={() => handleOpenCreateForm('life_moment')}
          size="sm"
        >
          紀錄生活
        </Button>
        
        {/* 位置追蹤狀態和控制 */}
        {isAuthenticated && (
          <Group gap="xs">
            <ActionIcon
              variant={isTracking ? "filled" : "outline"}
              color={isTracking ? "green" : "gray"}
              size="lg"
              onClick={isTracking ? stopTracking : startTracking}
              title={isTracking ? "停止位置追蹤" : "開始位置追蹤"}
            >
              <IconMapPin size={16} />
            </ActionIcon>
            
            {currentLocation && (
              <ActionIcon
                variant="outline"
                size="lg"
                onClick={forceUpdate}
                title="手動更新位置"
                loading={locationLoading}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            )}
            
            {isTracking && distanceMoved > 0 && (
              <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
                已移動 {distanceMoved.toFixed(0)}m
              </Text>
            )}
          </Group>
        )}
        
        <ActionIcon
          variant="outline"
          size="lg"
          onClick={openSidebar}
          title="寶藏列表"
        >
          <IconList size={18} />
        </ActionIcon>
        
        <ActionIcon
          variant="outline"
          size="lg"
          onClick={openTreasuresPage}
          title="寶藏管理"
        >
          <IconFilter size={18} />
        </ActionIcon>
      </Group>

      <AppShell.Main>
        <GoogleMapComponent
          center={mapCenter}
          zoom={15}
          markers={treasureMarkersForMap}
          currentLocation={currentLocation}
          showCurrentLocation={!!currentLocation}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onComment={handleComment}
          onCollect={handleCollect}
          onCommentsCountChange={handleCommentsCountChange}
          onAddTreasureAtLocation={(position, address) => handleOpenCreateForm('treasure', { latitude: position.lat, longitude: position.lng, address })}
          height="100vh" // 調整為全高
          width="100%"
        />
      </AppShell.Main>

      {/* 右上角的浮動按鈕，包含個人頭像 */}
      <Group 
        style={{
          position: 'fixed',
          top: 20, // 移到上方
          right: 20, // 保持在右邊
          zIndex: 1000,
          // 移除 flexDirection: 'column-reverse',
          // 移除 gap: 'md'
        }}
      >
        {/* 用戶個人資料選單 */}
        <Menu shadow="md" width={200} position="bottom-end"> {/* 調整菜單位置 */}
          <Menu.Target>
            <ActionIcon
              variant="light"
              size="lg" // 恢復到放大前的大小
              radius="50%"
            >
              <Avatar
                src={user?.avatar}
                size="sm" // 恢復到放大前的大小
                radius="50%"
              >
                <IconUser size={16} /> {/* 恢復到放大前的大小 */}
              </Avatar>
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>{user?.name}</Menu.Label>
            <Menu.Item
              leftSection={<IconUser size={14} />}
              onClick={openProfileModal}
            >
              個人資料
            </Menu.Item>
            <Menu.Item
              leftSection={<IconMapPin size={14} />}
              onClick={openLocationSettings}
            >
              位置追蹤設定
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconLogout size={14} />}
              color="red"
              onClick={logout}
            >
              登出
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* 搜尋結果側邊欄 */}
      <SearchResultsSidebar
        opened={searchSidebarOpened}
        onClose={() => setSearchSidebarOpened(false)}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isLoading={isSearching}
        onPlaceClick={handlePlaceClick}
        onTreasureClick={handleTreasureClick}
        onLike={handleLike}
        onFavorite={handleFavorite}
        onComment={handleComment}
      />

      <Drawer
        opened={sidebarOpened}
        onClose={closeSidebar}
        title="寶藏總覽" style={{ color: COLORS.TEXT.SECONDARY }}
        size="lg"
        position="right"
      >
        <Stack gap="md">
          {treasuresLoading && <Text>載入中...</Text>}
          {treasuresError && <Text c="red">載入失敗: {treasuresError}</Text>}
          
          <Text fw={600}>附近的寶藏 ({treasures.length})</Text>
          {treasures.length === 0 && !treasuresLoading && (
            <Text style={{ color: COLORS.TEXT.SECONDARY }}>目前沒有寶藏，快來創建第一個吧！</Text>
          )}
          {treasures.map(treasure => (
            <TreasureCard
              key={treasure.id}
              treasure={treasure}
              onLike={handleLike}
              onFavorite={handleFavorite}
              onDelete={user?.id === treasure.user.id ? handleDelete : undefined}
            />
          ))}
        </Stack>
      </Drawer>

      {/* 個人資料 Modal */}
      <ProfileModal
        opened={profileModalOpened}
        onClose={closeProfileModal}
      />

      {/* 寶藏表單 Modal */}
        <TreasureForm
          mode="create"
          creationMode={treasureCreationMode}
          opened={treasureFormOpened}
          onClose={() => {
            closeTreasureForm();
            setTreasureFormInitialData(undefined);
          }}
          initialData={treasureFormInitialData}
          onSubmit={handleTreasureSubmit}
          onCancel={() => {
            closeTreasureForm();
            setTreasureFormInitialData(undefined);
          }}
        />

      {/* 寶藏管理頁面 Modal */}
      <Modal
        opened={treasuresPageOpened}
        onClose={closeTreasuresPage}
        title="寶藏管理" style={{ color: COLORS.TEXT.SECONDARY }}
        size="xl"
        centered
      >
        <TreasuresPage />
      </Modal>

      {/* 個人檔案 Modal */}
      <ProfileModal
        opened={profileModalOpened}
        onClose={closeProfileModal}
      />

      {/* 位置追蹤設定 Modal */}
      <LocationSettingsModal
        opened={locationSettingsOpened}
        onClose={closeLocationSettings}
        settings={locationTrackingOptions}
        onSave={handleLocationSettingsSave}
        isTracking={isTracking}
      />
    </AppShell>
  );
}
