import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  NumberInput,
  Switch,
  Text,
  Divider,
  Alert
} from '@mantine/core';
import { IconInfoCircle, IconMapPin } from '@tabler/icons-react';
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

interface LocationSettingsModalProps {
  opened: boolean;
  onClose: () => void;
  settings: LocationTrackingSettings;
  onSave: (settings: LocationTrackingSettings) => void;
  isTracking: boolean;
}

const LocationSettingsModal: React.FC<LocationSettingsModalProps> = ({
  opened,
  onClose,
  settings,
  onSave,
  isTracking
}) => {
  const [localSettings, setLocalSettings] = useState<LocationTrackingSettings>(settings);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings({
      updateInterval: 30000,
      minDistanceThreshold: 100,
      enablePeriodicUpdate: true,
      enableDistanceTracking: true,
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="位置追蹤設定"
      size="md"
      centered
      styles={{
        header: {
          display: 'flex',
          justifyContent: 'center',
          color: COLORS.TEXT.SECONDARY,
        },
      }}
    >
      <Stack gap="md">
        {isTracking && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            variant="light"
          >
            位置追蹤正在運行中。修改設定後需要重新啟動追蹤才會生效。
          </Alert>
        )}

        <Stack gap="sm">
          <Text fw={600} style={{ color: COLORS.TEXT.PRIMARY }}>
            定時更新設定
          </Text>
          
          <Switch
            label="啟用定時更新"
            description="定期自動更新位置"
            checked={localSettings.enablePeriodicUpdate}
            onChange={(event) =>
              setLocalSettings(prev => ({
                ...prev,
                enablePeriodicUpdate: event.currentTarget.checked
              }))
            }
          />

          {localSettings.enablePeriodicUpdate && (
            <NumberInput
              label="更新間隔（秒）"
              description="每隔多少秒自動更新一次位置"
              value={localSettings.updateInterval / 1000}
              onChange={(value) =>
                setLocalSettings(prev => ({
                  ...prev,
                  updateInterval: (value || 30) * 1000
                }))
              }
              min={10}
              max={300}
              step={5}
              suffix="秒"
            />
          )}
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Text fw={600} style={{ color: COLORS.TEXT.PRIMARY }}>
            距離檢測設定
          </Text>
          
          <Switch
            label="啟用距離檢測"
            description="當移動超過設定距離時自動更新"
            checked={localSettings.enableDistanceTracking}
            onChange={(event) =>
              setLocalSettings(prev => ({
                ...prev,
                enableDistanceTracking: event.currentTarget.checked
              }))
            }
          />

          {localSettings.enableDistanceTracking && (
            <NumberInput
              label="距離閾值（米）"
              description="移動超過多少米時觸發更新"
              value={localSettings.minDistanceThreshold}
              onChange={(value) =>
                setLocalSettings(prev => ({
                  ...prev,
                  minDistanceThreshold: value || 100
                }))
              }
              min={10}
              max={1000}
              step={10}
              suffix="米"
            />
          )}
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Text fw={600} style={{ color: COLORS.TEXT.PRIMARY }}>
            定位精度設定
          </Text>
          
          <Switch
            label="高精度定位"
            description="使用 GPS 提供更精確的位置（耗電量較高）"
            checked={localSettings.enableHighAccuracy}
            onChange={(event) =>
              setLocalSettings(prev => ({
                ...prev,
                enableHighAccuracy: event.currentTarget.checked
              }))
            }
          />
        </Stack>

        <Alert
          icon={<IconMapPin size={16} />}
          color="orange"
          variant="light"
        >
          <Text size="sm">
            <strong>注意：</strong>
            <br />
            • 高精度定位會消耗更多電量
            <br />
            • 頻繁的位置更新可能影響設備性能
            <br />
            • 建議根據使用場景調整設定
          </Text>
        </Alert>

        <Group justify="space-between" mt="md">
          <Button variant="subtle" onClick={handleReset}>
            重置為預設值
          </Button>
          
          <Group>
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave}>
              儲存設定
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

export default LocationSettingsModal;
