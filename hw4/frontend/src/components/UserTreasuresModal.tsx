import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Group,
  Card,
  Button,
  Stack,
  Grid,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Loader,
  Center,
  Pagination,
  Title,
  Box
} from '@mantine/core';
import {
  IconMapPin,
  IconHeart,
  IconMessage,
  IconEye,
  IconEdit,
  IconTrash,
  IconAlertCircle
} from '@tabler/icons-react';
import { userService, UserTreasure } from '@/services/userService';
import { COLORS } from '@/utils/constants';

interface UserTreasuresModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'treasures' | 'favorites';
}

const UserTreasuresModal: React.FC<UserTreasuresModalProps> = ({ opened, onClose, mode }) => {
  const [treasures, setTreasures] = useState<UserTreasure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const title = mode === 'treasures' ? '我的寶藏' : '我的收藏';
  const pageSize = 6;

  // 獲取寶藏資料
  const fetchTreasures = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'treasures') {
        result = await userService.getUserTreasures(page, pageSize);
      } else {
        result = await userService.getUserFavorites(page, pageSize);
      }

      setTreasures(result.treasures);
      setTotal(result.total);
      setTotalPages(Math.ceil(result.total / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
      console.error('獲取寶藏失敗:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 當 modal 打開或 mode 改變時載入資料
  useEffect(() => {
    if (opened) {
      setCurrentPage(1);
      fetchTreasures(1);
    }
  }, [opened, mode]);

  // 處理分頁變更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTreasures(page);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 獲取寶藏類型顏色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'music': return 'blue';
      case 'audio': return 'green';
      case 'text': return 'orange';
      case 'link': return 'purple';
      case 'live_moment': return 'red';
      default: return 'gray';
    }
  };

  // 獲取寶藏類型名稱
  const getTypeName = (type: string) => {
    switch (type) {
      case 'music': return '音樂';
      case 'audio': return '音訊';
      case 'text': return '文字';
      case 'link': return '連結';
      case 'live_moment': return '即時時光';
      default: return type;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      padding="lg"
    >
      <Stack gap="md">
        {/* 統計資訊 */}
        <Group justify="space-between">
          <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
            共 {total} 個{mode === 'treasures' ? '寶藏' : '收藏'}
          </Text>
        </Group>

        {/* 錯誤訊息 */}
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            color="red" 
            title="載入失敗"
          >
            {error}
          </Alert>
        )}

        {/* 載入中 */}
        {isLoading && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text>載入中...</Text>
            </Stack>
          </Center>
        )}

        {/* 寶藏列表 */}
        {!isLoading && treasures.length > 0 && (
          <>
            <Grid>
              {treasures.map((treasure) => (
                <Grid.Col span={{ base: 12, sm: 6 }} key={treasure.id}>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Stack gap="sm">
                      {/* 標題和類型 */}
                      <Group justify="space-between" align="flex-start">
                        <Box style={{ flex: 1 }}>
                          <Text fw={600} size="sm" lineClamp={2}>
                            {treasure.title}
                          </Text>
                          <Badge 
                            color={getTypeColor(treasure.type)} 
                            size="xs" 
                            mt={4}
                          >
                            {getTypeName(treasure.type)}
                          </Badge>
                        </Box>
                      </Group>

                      {/* 內容預覽 */}
                      <Text size="xs" style={{ color: COLORS.TEXT.SECONDARY }} lineClamp={2}>
                        {treasure.content}
                      </Text>

                      {/* 位置資訊 */}
                      {treasure.address && (
                        <Group gap="xs">
                          <IconMapPin size={12} />
                          <Text size="xs" style={{ color: COLORS.TEXT.SECONDARY }} lineClamp={1}>
                            {treasure.address}
                          </Text>
                        </Group>
                      )}

                      {/* 標籤 */}
                      {treasure.tags.length > 0 && (
                        <Group gap="xs">
                          {treasure.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} size="xs" variant="light">
                              {tag}
                            </Badge>
                          ))}
                          {treasure.tags.length > 3 && (
                            <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
                              +{treasure.tags.length - 3}
                            </Text>
                          )}
                        </Group>
                      )}

                      {/* 統計和操作 */}
                      <Group justify="space-between" align="center">
                        <Group gap="md">
                          <Group gap="xs">
                            <IconHeart size={14} />
                            <Text size="xs">{treasure.likesCount}</Text>
                          </Group>
                          <Group gap="xs">
                            <IconMessage size={14} />
                            <Text size="xs">{treasure.commentsCount}</Text>
                          </Group>
                        </Group>

                        <Group gap="xs">
                          <Tooltip label="查看詳情">
                            <ActionIcon size="sm" variant="light">
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>
                          {mode === 'treasures' && (
                            <>
                              <Tooltip label="編輯">
                                <ActionIcon size="sm" variant="light" color="blue">
                                  <IconEdit size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="刪除">
                                <ActionIcon size="sm" variant="light" color="red">
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </>
                          )}
                        </Group>
                      </Group>

                      {/* 創建時間 */}
                      <Text size="xs" style={{ color: COLORS.TEXT.MUTED }} ta="right">
                        {formatDate(treasure.createdAt)}
                      </Text>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>

            {/* 分頁 */}
            {totalPages > 1 && (
              <Center mt="md">
                <Pagination
                  total={totalPages}
                  value={currentPage}
                  onChange={handlePageChange}
                  size="sm"
                />
              </Center>
            )}
          </>
        )}

        {/* 空狀態 */}
        {!isLoading && treasures.length === 0 && !error && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text size="lg" style={{ color: COLORS.TEXT.SECONDARY }}>
                {mode === 'treasures' ? '還沒有上傳任何寶藏' : '還沒有收藏任何寶藏'}
              </Text>
              <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
                {mode === 'treasures' 
                  ? '開始探索並上傳你的第一個寶藏吧！' 
                  : '去探索其他人的寶藏並加入收藏吧！'
                }
              </Text>
            </Stack>
          </Center>
        )}
      </Stack>
    </Modal>
  );
};

export default UserTreasuresModal;