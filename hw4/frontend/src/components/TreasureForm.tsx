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
  Center,
  Image,
  Text,
  Progress,
  Card
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUpload, IconInfoCircle, IconWorld, IconLock, IconX, IconMusic } from '@tabler/icons-react';
import { GiOpenChest, GiChest } from 'react-icons/gi';
import { TreasureFormProps, TreasureType } from '@/types';
import { TREASURE_TYPE_CONFIG, VALIDATION_RULES, APP_CONFIG } from '@/utils/constants';
import { COLORS } from '@/utils/constants';
import { mediaService, MediaUploadResult } from '@/services/mediaService';

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

  // 媒體上傳相關狀態
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(initialData?.mediaUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaUploadResult | null>(null);

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
      mediaUrl: initialData?.mediaUrl || '',
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
        // 檔案大小驗證
        if (value && value.size > APP_CONFIG.MAX_FILE_SIZE) {
          return '檔案大小不能超過 10MB';
        }
        // 注意：音樂/錄音檔的上傳檢查在 handleSubmit 中處理
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
        mediaUrl: initialData.mediaUrl || '',
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

      // 更新 visibilityState 根據當前數據
      if (mode === 'edit') {
        // 在編輯模式下，根據 isHidden 或 isPublic 來設置 visibilityState
        console.log('initialData.isHidden:', initialData.isHidden);
        console.log('initialData.isPublic:', initialData.isPublic);
        if (initialData.isHidden !== null && initialData.isHidden !== undefined) {
          // 這是寶藏：isHidden 為 true 表示隱藏，false 表示公開
          setVisibilityState(!initialData.isHidden); // 反轉，因為 visibilityState: true=公開
        } else if (initialData.isPublic !== null && initialData.isPublic !== undefined) {
          // 這是碎片：isPublic 直接對應 visibilityState
          setVisibilityState(initialData.isPublic);
        }
      }
    }
  }, [initialData, mode]);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // 處理圖片上傳
  const handleImageUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 模擬上傳進度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await mediaService.uploadImage(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedMediaUrl(result.url);
      setUploadedMediaInfo(result);
      form.setFieldValue('mediaUrl', result.url);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '圖片上傳失敗');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 處理音檔上傳
  const handleAudioUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 模擬上傳進度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await mediaService.uploadAudio(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedMediaUrl(result.url);
      setUploadedMediaInfo(result);
      form.setFieldValue('mediaUrl', result.url);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('音檔上傳失敗:', error);
      setUploadError(error instanceof Error ? error.message : '音檔上傳失敗');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 清除已上傳的媒體
  const clearUploadedMedia = () => {
    setUploadedMediaUrl(null);
    setUploadedMediaInfo(null);
    setUploadError(null);
    form.setFieldValue('mediaUrl', '');
  };

  // 處理 Modal 關閉
  const handleClose = () => {
    // 只在創建模式下清除表單狀態
    if (mode === 'create') {
      form.reset();
      setSelectedType(null);
      setVisibilityState(creationMode === 'treasure' ? false : true);
      clearUploadedMedia();
    }
    onClose();
  };

  // 處理表單提交成功後的清理
  const handleSubmitSuccess = (values: typeof form.values) => {
    handleSubmit(values);
    
    // 提交成功後清除表單狀態（只在創建模式下）
    if (mode === 'create') {
      form.reset();
      setSelectedType(null);
      setVisibilityState(creationMode === 'treasure' ? false : true);
      clearUploadedMedia();
    }
  };


  const handleSubmit = (values: typeof form.values) => {
    // Debug: Log media URL
    console.log('=== TreasureForm handleSubmit Debug ===');
    console.log('uploadedMediaUrl:', uploadedMediaUrl);
    console.log('form.values.mediaUrl:', values.mediaUrl);
    console.log('selectedType:', selectedType);
    console.log('mode:', mode);
    console.log('=====================================');

    // 對於音樂/錄音檔類型，檢查是否已上傳
    if ((selectedType === TreasureType.MUSIC || selectedType === TreasureType.AUDIO) && mode === 'create') {
      if (!uploadedMediaUrl) {
        console.error('音樂/錄音檔尚未上傳');
        form.setFieldError('mediaFile', '請上傳音頻檔案');
        return;
      }
    }

    // Apply mode-based visibility logic
    // 對於音樂/錄音檔類型，已經通過 mediaService.uploadAudio 上傳到 Cloudinary
    // 所以只需要傳 mediaUrl，不需要傳 mediaFile
    const isMusicOrAudio = selectedType === TreasureType.MUSIC || selectedType === TreasureType.AUDIO;
    const submitData = {
      ...values,
      type: selectedType!,
      tags: Array.isArray(values.tags) ? values.tags : [],
      // 對於音樂/錄音檔類型，使用 mediaUrl（已上傳到 Cloudinary）
      // 對於圖片類型，使用 mediaFile（需要通過後端上傳）
      mediaFile: (isMusicOrAudio ? undefined : (values.mediaFile || undefined)),
      mediaUrl: uploadedMediaUrl || undefined
    };

    console.log('submitData:', JSON.stringify(submitData, null, 2));

    if (mode === 'edit') {
      // In edit mode, determine if it's a treasure or fragment based on initialData
      const isTreasure = initialData?.isHidden !== null && initialData?.isHidden !== undefined;
      
      if (isTreasure) {
        // For treasure: set isHidden based on toggle, keep isPublic null
        submitData.isHidden = !visibilityState; // false = hidden, true = public
        submitData.isPublic = undefined;
      } else {
        // For fragment: set isPublic based on toggle, keep isHidden null
        submitData.isPublic = visibilityState; // true = public, false = private
        submitData.isHidden = undefined;
      }
    } else {
      // Create mode: use creationMode to determine
      if (creationMode === 'treasure') {
        // For treasure mode: set isHidden based on toggle, keep isPublic null
        submitData.isHidden = !visibilityState; // false = hidden, true = public
        submitData.isPublic = undefined;
      } else {
        // For life_moment mode: set isPublic based on toggle, keep isHidden null
        submitData.isPublic = visibilityState; // true = public, false = private
        submitData.isHidden = undefined;
      }
    }

    onSubmit(submitData);
  };

  const treasureTypeOptions = Object.entries(TREASURE_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: `${config.icon} ${config.label}`,
    style: {
      color: COLORS.TEXT.SECONDARY,
    },
  }));

  const showMediaUpload = selectedType === TreasureType.MUSIC || selectedType === TreasureType.AUDIO;
  const showLinkInput = selectedType === TreasureType.LINK;
  const showLiveLocation = selectedType === TreasureType.LIVE_MOMENT;

  // Get modal title based on mode
  const getModalTitle = () => {
    if (mode === 'edit') {
      // In edit mode, determine if it's a treasure or fragment based on initialData
      // Treasure: isHidden !== null (true or false)
      // Fragment: isPublic !== null (true or false)
      const isTreasure = initialData?.isHidden !== null && initialData?.isHidden !== undefined;
      const isFragment = initialData?.isPublic !== null && initialData?.isPublic !== undefined;
      return isTreasure ? '編輯寶藏' : (isFragment ? '編輯碎片' : '編輯');
    }
    return creationMode === 'treasure' ? '創建新寶藏' : '紀錄生活';
  };

  // Get submit button text based on mode
  const getSubmitButtonText = () => {
    if (mode === 'edit') {
      // In edit mode, determine if it's a treasure or fragment based on initialData
      // Treasure: isHidden !== null (true or false)
      // Fragment: isPublic !== null (true or false)
      const isTreasure = initialData?.isHidden !== null && initialData?.isHidden !== undefined;
      const isFragment = initialData?.isPublic !== null && initialData?.isPublic !== undefined;
      return isTreasure ? '更新寶藏' : (isFragment ? '更新碎片' : '更新');
    }
    return creationMode === 'treasure' ? '創建寶藏' : '紀錄生活';
  };

  // Render visibility toggle buttons
  const renderVisibilityToggle = () => {
    // In edit mode, determine if it's a treasure or fragment based on initialData
    // Treasure: isHidden !== null (true or false)
    // Fragment: isPublic !== null (true or false)
    const isTreasureMode = mode === 'edit' 
      ? (initialData?.isHidden !== null && initialData?.isHidden !== undefined)
      : creationMode === 'treasure';

    if (isTreasureMode) {
      // Treasure mode: show hidden (GiChest) and public (GiOpenChest) options
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
      // Fragment mode (isPublic): show public (IconWorld) and private (IconLock) options
      return (
        <Center>
          <Group gap="xs">
            <Tooltip label="公開碎片">
              <ActionIcon
                variant={visibilityState ? "filled" : "light"}
                color="blue"
                size="lg"
                onClick={() => setVisibilityState(true)}
              >
                <IconWorld size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="私人碎片">
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
        onClose={handleClose}
        title={getModalTitle()}
        centered
        size="lg"
        styles={{
          header: {
            display: 'flex',
            justifyContent: 'center',
            color: COLORS.TEXT.SECONDARY,
          },
          title: {
            flex: 1,
            textAlign: 'center',
            fontSize: '1.5rem', // 放大字體
            fontWeight: 700,    // 加粗
          },
        }}
      >
      <form onSubmit={form.onSubmit(handleSubmit)}>

          {/* Visibility Toggle Buttons */}
          {renderVisibilityToggle()}

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
            styles={{
              input: { color: COLORS.TEXT.SECONDARY },
              option: { color: COLORS.TEXT.SECONDARY }, // Use 'option' key for dropdown items
            }}
          />

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

          {/* 媒體上傳區域 */}
          {selectedType === TreasureType.IMAGE && (
            <Stack gap="sm">
              <Text size="sm" fw={500} style={{ color: COLORS.TEXT.SECONDARY }}>
                上傳圖片
              </Text>
              
              {!uploadedMediaUrl ? (
                <FileInput
                  placeholder="選擇圖片檔案"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  leftSection={<IconUpload size={16} />}
                />
              ) : (
                <Card withBorder p="sm">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Image
                        src={uploadedMediaUrl}
                        alt="上傳的圖片"
                        width={60}
                        height={60}
                        fit="cover"
                        radius="sm"
                      />
                      <div>
                        <Text size="sm" fw={500}>
                          圖片已上傳
                        </Text>
                        <Text size="xs" c="dimmed">
                          {uploadedMediaInfo && `${uploadedMediaInfo.width}×${uploadedMediaInfo.height}`}
                        </Text>
                      </div>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={clearUploadedMedia}
                      disabled={isUploading}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              )}

              {isUploading && (
                <Stack gap="xs">
                  <Progress value={uploadProgress} size="sm" />
                  <Text size="xs" c="dimmed" ta="center">
                    上傳中... {uploadProgress}%
                  </Text>
                </Stack>
              )}

              {uploadError && (
                <Alert color="red" variant="light">
                  {uploadError}
                </Alert>
              )}
            </Stack>
          )}

          {selectedType === TreasureType.AUDIO && (
            <Stack gap="sm">
              <Text size="sm" fw={500} style={{ color: COLORS.TEXT.SECONDARY }}>
                上傳音檔
              </Text>
              
              {!uploadedMediaUrl ? (
                <FileInput
                  placeholder="選擇音檔檔案"
                  accept=".mp3,.wav"
                  onChange={handleAudioUpload}
                  disabled={isUploading}
                  leftSection={<IconMusic size={16} />}
                />
              ) : (
                <Card withBorder p="sm">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <IconMusic size={24} color={COLORS.TEXT.SECONDARY} />
                      <div>
                        <Text size="sm" fw={500}>
                          音檔已上傳
                        </Text>
                        <Text size="xs" c="dimmed">
                          {uploadedMediaInfo && mediaService.formatFileSize(uploadedMediaInfo.bytes)}
                        </Text>
                      </div>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={clearUploadedMedia}
                      disabled={isUploading}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              )}

              {isUploading && (
                <Stack gap="xs">
                  <Progress value={uploadProgress} size="sm" />
                  <Text size="xs" c="dimmed" ta="center">
                    上傳中... {uploadProgress}%
                  </Text>
                </Stack>
              )}

              {uploadError && (
                <Alert color="red" variant="light">
                  {uploadError}
                </Alert>
              )}
            </Stack>
          )}

          {selectedType === TreasureType.MUSIC && (
            <Stack gap="sm">
              <Text size="sm" fw={500} style={{ color: COLORS.TEXT.SECONDARY }}>
                上傳音樂
              </Text>
              
              {!uploadedMediaUrl ? (
                <FileInput
                  placeholder="選擇音樂檔案"
                  accept=".mp3,.wav"
                  onChange={handleAudioUpload}
                  disabled={isUploading}
                  leftSection={<IconMusic size={16} />}
                />
              ) : (
                <Card withBorder p="sm">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <IconMusic size={24} color={COLORS.TEXT.SECONDARY} />
                      <div>
                        <Text size="sm" fw={500}>
                          音樂已上傳
                        </Text>
                        <Text size="xs" c="dimmed">
                          {uploadedMediaInfo && mediaService.formatFileSize(uploadedMediaInfo.bytes)}
                        </Text>
                      </div>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={clearUploadedMedia}
                      disabled={isUploading}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              )}

              {isUploading && (
                <Stack gap="xs">
                  <Progress value={uploadProgress} size="sm" />
                  <Text size="xs" c="dimmed" ta="center">
                    上傳中... {uploadProgress}%
                  </Text>
                </Stack>
              )}

              {uploadError && (
                <Alert color="red" variant="light">
                  {uploadError}
                </Alert>
              )}
            </Stack>
          )}

          {selectedType === TreasureType.LIVE_MOMENT && (
            <Stack gap="sm">
              <Text size="sm" fw={500} style={{ color: COLORS.TEXT.SECONDARY }}>
                上傳圖片（可選）
              </Text>
              
              {!uploadedMediaUrl ? (
                <FileInput
                  placeholder="選擇圖片檔案（可選）"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  leftSection={<IconUpload size={16} />}
                />
              ) : (
                <Card withBorder p="sm">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Image
                        src={uploadedMediaUrl}
                        alt="上傳的圖片"
                        width={60}
                        height={60}
                        fit="cover"
                        radius="sm"
                      />
                      <div>
                        <Text size="sm" fw={500}>
                          圖片已上傳
                        </Text>
                        <Text size="xs" c="dimmed">
                          {uploadedMediaInfo && `${uploadedMediaInfo.width}×${uploadedMediaInfo.height}`}
                        </Text>
                      </div>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={clearUploadedMedia}
                      disabled={isUploading}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              )}

              {isUploading && (
                <Stack gap="xs">
                  <Progress value={uploadProgress} size="sm" />
                  <Text size="xs" c="dimmed" ta="center">
                    上傳中... {uploadProgress}%
                  </Text>
                </Stack>
              )}

              {uploadError && (
                <Alert color="red" variant="light">
                  {uploadError}
                </Alert>
              )}
            </Stack>
          )}

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
              onClick={handleClose}
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