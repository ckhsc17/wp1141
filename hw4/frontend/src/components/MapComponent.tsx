import React from 'react';
import { Box, Text, Center } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { MapComponentProps } from '@/types';

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom = 12,
  markers = [],
  onMarkerClick,
  onMapClick,
  onBoundsChanged,
  height = '400px',
  width = '100%'
}) => {
  return (
    <Box 
      style={{ 
        height, 
        width, 
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e9ecef',
        backgroundColor: '#f8f9fa'
      }}
      onClick={() => onMapClick?.(center)}
    >
      <Center h="100%">
        <div style={{ textAlign: 'center' }}>
          <IconMapPin size={48} color="#999" />
          <Text size="lg" c="dimmed" mt="md">
            地圖組件開發中...
          </Text>
          <Text size="sm" c="dimmed">
            中心點: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </Text>
          <Text size="sm" c="dimmed">
            寶藏數量: {markers.length}
          </Text>
        </div>
      </Center>
    </Box>
  );
};

export default MapComponent;