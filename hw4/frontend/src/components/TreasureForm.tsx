import React, { useState, useEffect } from 'react';
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
  rem,
  ActionIcon,
  Tooltip,
  Center
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUpload, IconInfoCircle, IconWorld, IconLock } from '@tabler/icons-react';
import { GiOpenChest, GiChest } from 'react-icons/gi';
import { TreasureFormProps, TreasureType } from '@/types';
import { TREASURE_TYPE_CONFIG, VALIDATION_RULES, APP_CONFIG } from '@/utils/constants';
import { COLORS } from '@/utils/constants';

const TreasureForm: React.FC<TreasureFormProps> = ({
  mode,
  creationMode = 'treasure',
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
  
  // Visibility toggle state
  const [visibilityState, setVisibilityState] = useState<boolean>(
    creationMode === 'treasure' ? false : true // treasure: false=hidden, life_moment: true=public
  );

  const form = useForm({
    initialValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      type: initialData?.type || TreasureType.TEXT,
      latitude: initialData?.latitude || 0,
      longitude: initialData?.longitude || 0,
      address: initialData?.address || '',
      amount: initialData?.amount || '',
      isPublic: initialData?.isPublic,
      isHidden: initialData?.isHidden,
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

  // 當 initialData 變化時更新表單值
  useEffect(() => {
    console.log('TreasureForm initialData 變化:', initialData);
    if (initialData) {
      const newValues = {
        title: initialData.title || '',
        content: initialData.content || '',
        type: initialData.type || TreasureType.TEXT,
        latitude: initialData.latitude || 0,
        longitude: initialData.longitude || 0,
        address: initialData.address || '',
        amount: initialData.amount || '',
        isPublic: initialData.isPublic,
        isHidden: initialData.isHidden,
        mediaFile: null,
        linkUrl: initialData.linkUrl || '',
        tags: initialData.tags || [],
        isLiveLocation: initialData.isLiveLocation || false
      };
      console.log('設置表單值:', newValues);
      form.setValues(newValues);
      
      // 如果有類型資訊，也更新 selectedType
      if (initialData.type) {
        setSelectedType(initialData.type);
      }
    }
  }, [initialData]);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };


  const handleSubmit = (values: typeof form.values) => {
    // Apply mode-based visibility logic
    const submitData = {
      ...values,
      type: selectedType!,
      tags: Array.isArray(values.tags) ? values.tags : [],
      mediaFile: values.mediaFile || undefined
    };

    if (creationMode === 'treasure') {
      // For treasure mode: set isHidden based on toggle, keep isPublic null
      submitData.isHidden = !visibilityState; // false = hidden, true = public
      submitData.isPublic = undefined;
    } else {
      // For life_moment mode: set isPublic based on toggle, keep isHidden null
      submitData.isPublic = visibilityState; // true = public, false = private
      submitData.isHidden = undefined;
    }

    onSubmit(submitData);
  };

  const treasureTypeOptions = Object.entries(TREASURE_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: `${config.icon} ${config.label}`
  }));

  const showMediaUpload = selectedType === TreasureType.MUSIC || selectedType === TreasureType.AUDIO;
  const showLinkInput = selectedType === TreasureType.LINK;
  const showLiveLocation = selectedType === TreasureType.LIVE_MOMENT;

  // Get modal title based on mode
  const getModalTitle = () => {
    if (mode === 'edit') return '編輯寶藏';
    return creationMode === 'treasure' ? '創建新寶藏' : '紀錄生活';
  };

  // Get submit button text based on mode
  const getSubmitButtonText = () => {
    if (mode === 'edit') return '更新寶藏';
    return creationMode === 'treasure' ? '創建寶藏' : '紀錄生活';
  };

  // Render visibility toggle buttons
  const renderVisibilityToggle = () => {
    if (mode === 'edit') return null; // Don't show toggle in edit mode

    if (creationMode === 'treasure') {
      return (
        <Center>
          <Group gap="xs">
            <Tooltip label="隱藏寶藏直到有人經過">
              <ActionIcon
                variant={!visibilityState ? "filled" : "light"}
                color="blue"
                size="lg"
                onClick={() => setVisibilityState(false)}
              >
                <GiChest size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="公開寶藏位置">
              <ActionIcon
                variant={visibilityState ? "filled" : "light"}
                color="green"
                size="lg"
                onClick={() => setVisibilityState(true)}
              >
                <GiOpenChest size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Center>
      );
    } else {
      return (
        <Center>
          <Group gap="xs">
            <Tooltip label="公開">
              <ActionIcon
                variant={visibilityState ? "filled" : "light"}
                color="blue"
                size="lg"
                onClick={() => setVisibilityState(true)}
              >
                <IconWorld size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="私人">
              <ActionIcon
                variant={!visibilityState ? "filled" : "light"}
                color="gray"
                size="lg"
                onClick={() => setVisibilityState(false)}
              >
                <IconLock size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Center>
      );
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={getModalTitle()}
      size="lg"
      centered
      styles={{
        header: {
          display: 'flex',
          justifyContent: 'center',
          color: COLORS.TEXT.SECONDARY,
        },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="寶藏類型"
            style={{ color: COLORS.TEXT.SECONDARY }}
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

          {/* Visibility Toggle Buttons */}
          {renderVisibilityToggle()}

          <TextInput
            label="標題"
            style={{ color: COLORS.TEXT.SECONDARY }}
            placeholder="為你的寶藏起個好名字"
            {...form.getInputProps('title')}
            required
          />

          <Textarea
            label="內容描述"
            style={{ color: COLORS.TEXT.SECONDARY }}
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
              style={{ color: COLORS.TEXT.SECONDARY }}
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
              style={{ color: COLORS.TEXT.SECONDARY }}
              placeholder="https://..."
              {...form.getInputProps('linkUrl')}
              required
            />
          )}

          <MultiSelect
            label="標籤"
            style={{ color: COLORS.TEXT.SECONDARY }}
            placeholder="新增標籤（按 Enter 確認）"
            data={[]}
            searchable
            {...form.getInputProps('tags')}
          />

          <TextInput
            label="地址"
            style={{ color: COLORS.TEXT.SECONDARY }}
            placeholder="地址資訊"
            {...form.getInputProps('address')}
            readOnly
          />

          <Group grow>
            <TextInput
              label="緯度"
              style={{ color: COLORS.TEXT.SECONDARY }}
              placeholder="緯度"
              {...form.getInputProps('latitude')}
              readOnly
            />
            <TextInput
              label="經度"
              style={{ color: COLORS.TEXT.SECONDARY }}
              placeholder="經度"
              {...form.getInputProps('longitude')}
              readOnly
            />
          </Group>

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
              {getSubmitButtonText()}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default TreasureForm;