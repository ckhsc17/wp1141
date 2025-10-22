import React from 'react';
import { Card, ActionIcon, Text, Button, Stack, Group, Loader } from '@mantine/core';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { IconX, IconMapPin, IconPlus } from '@tabler/icons-react';
import { getInfoWindowContainerStyle, getInfoWindowCardStyle, INFO_WINDOW_STYLES } from './InfoWindowStyles';
import { COLORS } from '@/utils/constants';

export interface LocationInfoWindowProps {
  /** The position where the user clicked */
  position: google.maps.LatLngLiteral;
  /** The geocoded address for the location */
  address: string | null;
  /** Whether address is currently being loaded */
  addressLoading: boolean;
  /** Error message if geocoding failed */
  addressError: string | null;
  /** Callback when the close button is clicked */
  onClose: () => void;
  /** Callback when "Add Treasure Here" button is clicked */
  onAddTreasureHere?: (position: google.maps.LatLngLiteral) => void;
}

/**
 * InfoWindow component that displays location information when user clicks on empty map areas
 */
export const LocationInfoWindow: React.FC<LocationInfoWindowProps> = ({
  position,
  address,
  addressLoading,
  addressError,
  onClose,
  onAddTreasureHere
}) => {
  /**
   * Format coordinates to display with appropriate precision
   */
  const formatCoordinate = (value: number): string => {
    return value.toFixed(6);
  };

  /**
   * Handle "Add Treasure Here" button click
   */
  const handleAddTreasure = () => {
    if (onAddTreasureHere) {
      onAddTreasureHere(position);
    }
  };

  /**
   * Render address section with loading/error states
   */
  const renderAddressSection = () => {
    if (addressLoading) {
      return (
        <Group gap="xs">
          <Loader size="xs" />
          <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
            正在獲取地址...
          </Text>
        </Group>
      );
    }

    if (addressError) {
      return (
        <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
          地址無法獲取
        </Text>
      );
    }

    if (address) {
      return (
        <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
          {address}
        </Text>
      );
    }

    return (
      <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
        地址不可用
      </Text>
    );
  };

  return (
    <AdvancedMarker
      position={position}
      clickable={false}
      zIndex={1000}
    >
      <div 
        style={getInfoWindowContainerStyle()}
        onClick={(e) => e.stopPropagation()} // 阻止事件冒泡到地圖
      >
        <Card
          shadow="lg"
          padding="md"
          radius="md"
          withBorder
          style={getInfoWindowCardStyle()}
        >
          {/* Arrow border */}
          <div style={INFO_WINDOW_STYLES.arrowBorder} />
          
          {/* Arrow fill */}
          <div style={INFO_WINDOW_STYLES.arrow} />

          {/* Close button */}
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={onClose}
            style={INFO_WINDOW_STYLES.closeButton}
            title="關閉"
          >
            <IconX size={16} />
          </ActionIcon>

          <Stack gap="md">
            {/* Header with location icon */}
            <Group gap="xs">
              <IconMapPin size={20} style={{ color: COLORS.ICON.DEFAULT }} />
              <Text fw={600} size="md">
                位置資訊
              </Text>
            </Group>

            {/* Coordinates */}
            <Stack gap="xs">
              <Text size="sm" fw={500} style={{ color: COLORS.TEXT.PRIMARY }}>
                座標
              </Text>
              <Stack gap={4}>
                <Text size="sm" ff="monospace" style={{ color: COLORS.TEXT.SECONDARY }}>
                  緯度: {formatCoordinate(position.lat)}
                </Text>
                <Text size="sm" ff="monospace" style={{ color: COLORS.TEXT.SECONDARY }}>
                  經度: {formatCoordinate(position.lng)}
                </Text>
              </Stack>
            </Stack>

            {/* Address */}
            <Stack gap="xs">
              <Text size="sm" fw={500} style={{ color: COLORS.TEXT.PRIMARY }}>
                地址
              </Text>
              {renderAddressSection()}
            </Stack>

            {/* Add Treasure Button */}
            {onAddTreasureHere && (
              <Button
                leftSection={<IconPlus size={16} />}
                variant="filled"
                size="sm"
                onClick={handleAddTreasure}
                fullWidth
              >
                在此新增寶藏
              </Button>
            )}
          </Stack>
        </Card>
      </div>
    </AdvancedMarker>
  );
};
