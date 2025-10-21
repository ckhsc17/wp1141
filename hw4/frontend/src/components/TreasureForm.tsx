import React, { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  FileInput,
  MultiSelect,
  Switch,
  Alert,
  rem
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUpload, IconInfoCircle } from '@tabler/icons-react';
import { TreasureFormProps, TreasureType } from '@/types';
import { TREASURE_TYPE_CONFIG, VALIDATION_RULES, APP_CONFIG } from '@/utils/constants';
import { useGeolocation } from '@/hooks/useGeolocation';
import { COLORS } from '@/utils/constants';

const TreasureForm: React.FC<TreasureFormProps> = ({
  mode,
  opened,
  onClose,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedType, setSelectedType] = useState<TreasureType | null>(
    initialData?.type || null
  );
  const { getCurrentLocation, loading: locationLoading } = useGeolocation();

  const form = useForm({
    initialValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      type: initialData?.type || TreasureType.TEXT,
      latitude: initialData?.latitude || 0,
      longitude: initialData?.longitude || 0,
      address: initialData?.address || '',
      mediaFile: null as File | null,
      linkUrl: initialData?.linkUrl || '',
      tags: initialData?.tags || [],
      isLiveLocation: initialData?.isLiveLocation || false
    },
    validate: {
      title: (value) => {
        if (value.length < VALIDATION_RULES.TREASURE.TITLE.MIN_LENGTH) {
          return '標題不能為空';
        }
        if (value.length > VALIDATION_RULES.TREASURE.TITLE.MAX_LENGTH) {
          return `標題不能超過 ${VALIDATION_RULES.TREASURE.TITLE.MAX_LENGTH} 字`;
        }
        return null;
      },
      content: (value) => {
        if (value.length < VALIDATION_RULES.TREASURE.CONTENT.MIN_LENGTH) {
          return '內容不能為空';
        }
        if (value.length > VALIDATION_RULES.TREASURE.CONTENT.MAX_LENGTH) {
          return `內容不能超過 ${VALIDATION_RULES.TREASURE.CONTENT.MAX_LENGTH} 字`;
        }
        return null;
      },
      mediaFile: (value, values) => {
        if ((values.type === TreasureType.MUSIC || values.type === TreasureType.AUDIO) && mode === 'create' && !value) {
          return '請上傳音頻檔案';
        }
        if (value && value.size > APP_CONFIG.MAX_FILE_SIZE) {
          return '檔案大小不能超過 10MB';
        }
        return null;
      },
      linkUrl: (value, values) => {
        if (values.type === TreasureType.LINK && !value) {
          return '請輸入連結網址';
        }
        if (value && !isValidUrl(value)) {
          return '請輸入有效的網址';
        }
        return null;
      },
      tags: (value) => {
        if (value.length > VALIDATION_RULES.TREASURE.TAGS.MAX_COUNT) {
          return `標籤不能超過 ${VALIDATION_RULES.TREASURE.TAGS.MAX_COUNT} 個`;
        }
        return null;
      }
    }
  });

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      form.setFieldValue('latitude', location.lat);
      form.setFieldValue('longitude', location.lng);
      
      // 如果是「活在當下」類型，自動啟用即時定位
      if (selectedType === TreasureType.LIVE_MOMENT) {
        form.setFieldValue('isLiveLocation', true);
      }
    } catch (error) {
      console.error('取得位置失敗:', error);
    }
  };

  const handleSubmit = (values: typeof form.values) => {
    onSubmit({
      ...values,
      type: selectedType!,
      tags: Array.isArray(values.tags) ? values.tags : [],
      mediaFile: values.mediaFile || undefined
    });
  };

  const treasureTypeOptions = Object.entries(TREASURE_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: `${config.icon} ${config.label}`
  }));

  const showMediaUpload = selectedType === TreasureType.MUSIC || selectedType === TreasureType.AUDIO;
  const showLinkInput = selectedType === TreasureType.LINK;
  const showLiveLocation = selectedType === TreasureType.LIVE_MOMENT;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? '創建新寶藏' : '編輯寶藏'}
      style={{ color: COLORS.TEXT.SECONDARY }}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="寶藏類型"
            placeholder="選擇寶藏類型"
            data={treasureTypeOptions}
            value={selectedType}
            onChange={(value) => {
              setSelectedType(value as TreasureType);
              form.setFieldValue('type', value as TreasureType);
            }}
            required
            disabled={mode === 'edit'}
          />

          {selectedType && (
            <Alert 
              icon={<IconInfoCircle size={16} />}
              variant="light"
              color="blue"
            >
              {TREASURE_TYPE_CONFIG[selectedType].description}
            </Alert>
          )}

          <TextInput
            label="標題"
            placeholder="為你的寶藏起個好名字"
            {...form.getInputProps('title')}
            required
          />

          <Textarea
            label="內容描述"
            placeholder="描述這個寶藏的故事..."
            minRows={3}
            maxRows={6}
            autosize
            {...form.getInputProps('content')}
            required
          />

          {showMediaUpload && (
            <FileInput
              label="音頻檔案"
              placeholder="選擇音頻檔案"
              accept="audio/*"
              leftSection={<IconUpload size={rem(14)} />}
              {...form.getInputProps('mediaFile')}
              required={mode === 'create'}
            />
          )}

          {showLinkInput && (
            <TextInput
              label="連結網址"
              placeholder="https://..."
              {...form.getInputProps('linkUrl')}
              required
            />
          )}

          <MultiSelect
            label="標籤"
            placeholder="新增標籤（按 Enter 確認）"
            data={[]}
            searchable
            {...form.getInputProps('tags')}
          />

          <Group grow>
            <TextInput
              label="緯度"
              placeholder="緯度"
              {...form.getInputProps('latitude')}
              readOnly
            />
            <TextInput
              label="經度"
              placeholder="經度"
              {...form.getInputProps('longitude')}
              readOnly
            />
          </Group>

          <Button
            variant="outline"
            onClick={handleGetCurrentLocation}
            loading={locationLoading}
            fullWidth
          >
            取得目前位置
          </Button>

          {showLiveLocation && (
            <Switch
              label="活在當下標記"
              description="標記你目前實際所在的位置（20公尺範圍）"
              {...form.getInputProps('isLiveLocation', { type: 'checkbox' })}
            />
          )}

          <Group justify="flex-end" gap="sm">
            <Button 
              variant="subtle" 
              onClick={onCancel}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              loading={isLoading}
              disabled={!selectedType || (form.values.latitude === 0 && form.values.longitude === 0)}
            >
              {mode === 'create' ? '創建寶藏' : '更新寶藏'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default TreasureForm;