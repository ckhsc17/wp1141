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
  Modal
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
  IconRefresh
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import GoogleMapComponent from '@/components/GoogleMapComponent';
import TreasureForm from '@/components/TreasureForm';
import TreasureCard from '@/components/TreasureCard';
import TreasuresPage from '@/components/TreasuresPage';
import ProfileModal from '@/components/ProfileModal';
import LoginPage from '@/components/LoginPage';
import LocationSettingsModal from '@/components/LocationSettingsModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTreasures } from '@/hooks/useTreasures';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { MapLocation, TreasureMarker, TreasureType, CreateTreasureRequest, TreasureDTO } from '@/types';
import { COLORS } from '@/utils/constants';

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
    deleteTreasure,
    refetch: refetchTreasures
  } = useTreasures({});

  // 位置追蹤設定狀態
  const [locationTrackingOptions, setLocationTrackingOptions] = useState({
    updateInterval: 30000, // 30秒定時更新
    minDistanceThreshold: 100, // 移動100米觸發更新
    enablePeriodicUpdate: true,
    enableDistanceTracking: true,
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000
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
      header={{ height: 60 }}
      padding={0}
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openTreasureForm}
                size="sm"
              >
                新增寶藏
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

            {/* 用戶個人資料選單 */}
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon
                  variant="light"
                  size="lg"
                  radius="50%"
                >
                  <Avatar
                    src={user?.avatar}
                    size="sm"
                    radius="50%"
                  >
                    <IconUser size={16} />
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
        </Container>
      </AppShell.Header>

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
          onCommentsCountChange={handleCommentsCountChange}
          onAddTreasureAtLocation={handleAddTreasureAtLocation}
          height="calc(100vh - 60px)"
          width="100%"
        />
      </AppShell.Main>

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
