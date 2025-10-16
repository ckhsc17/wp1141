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
  Text
} from '@mantine/core';
import {
  IconPlus,
  IconFilter,
  IconLocation,
  IconMap
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import GoogleMapComponent from '@/components/GoogleMapComponent';
import TreasureForm from '@/components/TreasureForm';
import { MapLocation, TreasureMarker, TreasureType } from '@/types';

export default function HomePage() {
  const [treasureFormOpened, { open: openTreasureForm, close: closeTreasureForm }] = useDisclosure(false);
  const [sidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false);
  
  // 預設地圖中心（台北101）
  const [mapCenter, setMapCenter] = useState<MapLocation>({
    lat: 25.0330,
    lng: 121.5654
  });

  // 當前位置狀態
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);

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

  // 示例寶藏標記
  const treasureMarkersForMap = [
    {
      key: 'treasure1',
      location: { lat: 25.0330, lng: 121.5654 },
      title: '台北101寶藏'
    },
    {
      key: 'treasure2', 
      location: { lat: 25.0478, lng: 121.5318 },
      title: '中正紀念堂寶藏'
    },
    {
      key: 'treasure3',
      location: { lat: 25.0417, lng: 121.5115 },
      title: '龍山寺寶藏'
    }
  ];

  const [treasureMarkers] = useState<TreasureMarker[]>([]);

  const handleMapClick = (location: MapLocation) => {
    console.log('地圖點擊:', location);
  };

  const handleMarkerClick = (marker: TreasureMarker) => {
    console.log('標記點擊:', marker);
  };

  // 處理寶藏表單提交
  const handleTreasureSubmit = (data: any) => {
    console.log('新增寶藏:', data);
    // TODO: 實作新增寶藏邏輯
    closeTreasureForm();
  };

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
            onMarkerClick={(position) => console.log('標記點擊:', position)}
            height="calc(100vh - 100px)"
            width="100%"
          />
        </Container>
      </AppShell.Main>

      <Drawer
        opened={sidebarOpened}
        onClose={closeSidebar}
        title="寶藏總覽"
        size="lg"
        position="right"
      >
        <Stack gap="md">
          <Text>寶藏功能開發中...</Text>
        </Stack>
      </Drawer>

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
