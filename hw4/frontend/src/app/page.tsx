'use client';

import React, { useState } from 'react';
import {
  AppShell,
  Container,
  Group,
  Title,
  Button,
  ActionIcon,
  Drawer,
  Stack,
  Text,
  Avatar,
  Menu
} from '@mantine/core';
import {
  IconPlus,
  IconFilter,
  IconLocation,
  IconMap,
  IconUser,
  IconSettings,
  IconLogout
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import GoogleMapComponent from '@/components/GoogleMapComponent';
import TreasureForm from '@/components/TreasureForm';
import TreasureCard from '@/components/TreasureCard';
import ProfileModal from '@/components/ProfileModal';
import LoginPage from '@/components/LoginPage';
import { useAuth } from '@/contexts/AuthContext';
import { useTreasures } from '@/hooks/useTreasures';
import { MapLocation, TreasureMarker, TreasureType, CreateTreasureRequest, TreasureDTO } from '@/types';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [treasureFormOpened, { open: openTreasureForm, close: closeTreasureForm }] = useDisclosure(false);
  const [sidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false);
  const [profileModalOpened, { open: openProfileModal, close: closeProfileModal }] = useDisclosure(false);
  const [selectedTreasure, setSelectedTreasure] = useState<TreasureDTO | null>(null);
  
  // 預設地圖中心（台北101）
  const [mapCenter, setMapCenter] = useState<MapLocation>({
    lat: 25.0330,
    lng: 121.5654
  });

  // 當前位置狀態
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);

  // 使用 useTreasures hook 獲取真實資料
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

  // 處理獲取當前位置
  const handleGetCurrentLocation = () => {
    console.log('嘗試獲取當前位置...');
    
    if (!navigator.geolocation) {
      console.error('瀏覽器不支援地理位置功能');
      alert('此瀏覽器不支援地理位置功能');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('成功獲取當前位置:', newLocation);
        setCurrentLocation(newLocation);
        setShowCurrentLocation(true);
        setMapCenter(newLocation); // 移動地圖中心到當前位置
      },
      (error) => {
        console.error('獲取位置失敗:', error);
        alert('無法獲取您的位置，請檢查位置權限設定');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
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

  const handleMarkerClick = (position: google.maps.LatLngLiteral) => {
    // 找到被點擊的寶藏
    const clickedTreasure = treasures.find(treasure => 
      Math.abs(treasure.latitude - position.lat) < 0.0001 && 
      Math.abs(treasure.longitude - position.lng) < 0.0001
    );
    
    if (clickedTreasure) {
      console.log('標記點擊 - 寶藏:', clickedTreasure.title);
      setSelectedTreasure(clickedTreasure);
      openSidebar();
    }
  };

  // 處理寶藏表單提交
  const handleTreasureSubmit = async (data: CreateTreasureRequest) => {
    try {
      console.log('新增寶藏:', data);
      await createTreasure(data);
      await refetchTreasures();
      closeTreasureForm();
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

  // 處理刪除
  const handleDelete = async (treasureId: string) => {
    if (confirm('確定要刪除這個寶藏嗎？')) {
      try {
        await deleteTreasure(treasureId);
        await refetchTreasures();
        setSelectedTreasure(null);
        closeSidebar();
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
      header={{ height: 70 }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group>
              <IconMap size={32} color="#FD7E14" />
              <Title order={2} c="orange">
                尋寶地圖
              </Title>
            </Group>
            
            <Group>
              <Button
                leftSection={<IconLocation size={16} />}
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
              >
                我的位置
              </Button>
              
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openTreasureForm}
                size="sm"
              >
                新增寶藏
              </Button>
              
              <ActionIcon
                variant="outline"
                size="lg"
                onClick={openSidebar}
              >
                <IconFilter size={18} />
              </ActionIcon>

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
                    leftSection={<IconSettings size={14} />}
                  >
                    設定
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
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" h="calc(100vh - 70px)">
          <GoogleMapComponent
            center={mapCenter}
            zoom={15}
            markers={treasureMarkersForMap}
            currentLocation={currentLocation}
            showCurrentLocation={showCurrentLocation}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
            height="calc(100vh - 100px)"
            width="100%"
          />
        </Container>
      </AppShell.Main>

      <Drawer
        opened={sidebarOpened}
        onClose={closeSidebar}
        title={selectedTreasure ? selectedTreasure.title : "寶藏總覽"}
        size="lg"
        position="right"
      >
        <Stack gap="md">
          {treasuresLoading && <Text>載入中...</Text>}
          {treasuresError && <Text c="red">載入失敗: {treasuresError}</Text>}
          
          {selectedTreasure ? (
            <TreasureCard
              treasure={selectedTreasure}
              onLike={handleLike}
              onFavorite={handleFavorite}
              onDelete={user?.id === selectedTreasure.user.id ? handleDelete : undefined}
            />
          ) : (
            <>
              <Text fw={600}>附近的寶藏 ({treasures.length})</Text>
              {treasures.length === 0 && !treasuresLoading && (
                <Text c="dimmed">目前沒有寶藏，快來創建第一個吧！</Text>
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
            </>
          )}
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
        opened={treasureFormOpened}
        onClose={closeTreasureForm}
        onSubmit={handleTreasureSubmit}
        onCancel={closeTreasureForm}
      />
    </AppShell>
  );
}
