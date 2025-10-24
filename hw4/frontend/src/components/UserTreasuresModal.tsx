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
import { notifications } from '@mantine/notifications';
import {
  IconMapPin,
  IconHeart,
  IconMessage,
  IconEye,
  IconEdit,
  IconTrash,
  IconAlertCircle
} from '@tabler/icons-react';
import { userService, UserTreasure, UserCollect } from '@/services/userService';
import { treasureService } from '@/services/treasureService';
import TreasureForm from './TreasureForm';
import { CreateTreasureRequest, UpdateTreasureRequest } from '@/types';
import { COLORS } from '@/utils/constants';

interface UserTreasuresModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'treasures' | 'favorites' | 'fragments' | 'collects';
}

const UserTreasuresModal: React.FC<UserTreasuresModalProps> = ({ opened, onClose, mode }) => {
  const [treasures, setTreasures] = useState<UserTreasure[]>([]);
  const [collects, setCollects] = useState<UserCollect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // 編輯表單狀態
  const [editFormOpened, setEditFormOpened] = useState(false);
  const [editingTreasure, setEditingTreasure] = useState<UserTreasure | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const getTitle = () => {
    switch (mode) {
      case 'treasures': return '我的寶藏';
      case 'favorites': return '我的收藏';
      case 'fragments': return '我的碎片';
      case 'collects': return '我的收集';
      default: return '我的寶藏';
    }
  };
  const pageSize = 6;

  // 獲取寶藏資料
  const fetchTreasures = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'treasures') {
        result = await userService.getUserTreasures(page, pageSize, undefined, true); // 獲取 isHidden !== null 的寶藏
        setTreasures(result.treasures);
        setTotal(result.total);
        setTotalPages(Math.ceil(result.total / pageSize));
      } else if (mode === 'favorites') {
        result = await userService.getUserFavorites(page, pageSize);
        setTreasures(result.treasures);
        setTotal(result.total);
        setTotalPages(Math.ceil(result.total / pageSize));
      } else if (mode === 'fragments') {
        result = await userService.getUserTreasures(page, pageSize, true, undefined); // 獲取 isPublic !== null 的碎片
        setTreasures(result.treasures);
        setTotal(result.total);
        setTotalPages(Math.ceil(result.total / pageSize));
      } else if (mode === 'collects') {
        const collectsResult = await userService.getUserCollects(page, pageSize);
        setCollects(collectsResult.collects);
        setTotal(collectsResult.total);
        setTotalPages(Math.ceil(collectsResult.total / pageSize));
        return; // Early return for collects mode
      }

      // 這裡的邏輯不再需要，因為各個模式已經在上面分別處理了 setTotal 和 setTotalPages
      // if (mode !== 'collects' && result) {
      //   setTotal(result.total);
      //   setTotalPages(Math.ceil(result.total / pageSize));
      // }
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

  // 處理編輯寶藏
  const handleEditTreasure = (treasure: UserTreasure) => {
    setEditingTreasure(treasure);
    setEditFormOpened(true);
  };

  // 處理更新寶藏
  const handleUpdateTreasure = async (data: CreateTreasureRequest) => {
    if (!editingTreasure) return;

    setIsUpdating(true);
    try {
      const updateData: UpdateTreasureRequest = {
        title: data.title,
        content: data.content,
        tags: data.tags,
        linkUrl: data.linkUrl,
        amount: data.amount,
        isPublic: data.isPublic,
        isHidden: data.isHidden
      };

      await treasureService.updateTreasure(editingTreasure.id, updateData);
      
      // 更新本地狀態
      setTreasures(prev => prev.map(t => 
        t.id === editingTreasure.id 
          ? { ...t, ...updateData }
          : t
      ));
      
      setEditFormOpened(false);
      setEditingTreasure(null);
      
      notifications.show({
        title: '更新成功',
        message: '寶藏已成功更新',
        color: 'green',
      });
    } catch (error) {
      console.error('更新寶藏失敗:', error);
      setError('更新寶藏失敗');
      notifications.show({
        title: '更新失敗',
        message: '更新寶藏時發生錯誤',
        color: 'red',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 處理刪除寶藏
  const handleDeleteTreasure = (treasure: UserTreasure) => {
    const confirmed = window.confirm(`確定要刪除「${treasure.title}」嗎？此操作無法復原。`);
    
    if (confirmed) {
      deleteTreasure(treasure);
    }
  };

  // 執行刪除操作
  const deleteTreasure = async (treasure: UserTreasure) => {
    try {
      await treasureService.deleteTreasure(treasure.id);
      
      // 從本地狀態移除
      setTreasures(prev => prev.filter(t => t.id !== treasure.id));
      setTotal(prev => prev - 1);
      
      // 如果當前頁面沒有寶藏了，回到上一頁
      if (treasures.length === 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      }

      notifications.show({
        title: '刪除成功',
        message: '寶藏已成功刪除',
        color: 'green',
      });
    } catch (error) {
      console.error('刪除寶藏失敗:', error);
      setError('刪除寶藏失敗');
      notifications.show({
        title: '刪除失敗',
        message: '刪除寶藏時發生錯誤',
        color: 'red',
      });
    }
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
      title={getTitle()}
      style={{ color: COLORS.TEXT.SECONDARY }}
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
        {!isLoading && mode !== 'collects' && treasures.length > 0 && (
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
                                <ActionIcon 
                                  size="sm" 
                                  variant="light" 
                                  color="blue"
                                  onClick={() => handleEditTreasure(treasure)}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="刪除">
                                <ActionIcon 
                                  size="sm" 
                                  variant="light" 
                                  color="red"
                                  onClick={() => handleDeleteTreasure(treasure)}
                                >
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

        {/* 收集列表 */}
        {!isLoading && mode === 'collects' && collects.length > 0 && (
          <>
            <Grid>
              {collects.map((collect) => (
                <Grid.Col span={{ base: 12, sm: 6 }} key={collect.id}>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Stack gap="sm">
                      {/* 標題和類型 */}
                      <Group justify="space-between" align="flex-start">
                        <Box style={{ flex: 1 }}>
                          <Text fw={600} size="sm" lineClamp={2}>
                            {collect.treasure.title}
                          </Text>
                          <Badge 
                            color={getTypeColor(collect.treasure.type)} 
                            size="xs" 
                            mt={4}
                          >
                            {getTypeName(collect.treasure.type)}
                          </Badge>
                          {collect.isLocked && (
                            <Badge color="red" size="xs" mt={4} ml={4}>
                              🔒 鎖定
                            </Badge>
                          )}
                        </Box>
                      </Group>

                      {/* 內容預覽 */}
                      <Text size="xs" style={{ color: COLORS.TEXT.SECONDARY }} lineClamp={2}>
                        {collect.treasure.content}
                      </Text>

                      {/* 統計資訊 */}
                      <Group gap="md" mt="xs">
                        <Group gap={4}>
                          <IconHeart size={14} color="#e03131" />
                          <Text size="xs" style={{ color: COLORS.TEXT.SECONDARY }}>
                            {collect.treasure.likesCount}
                          </Text>
                        </Group>
                        <Group gap={4}>
                          <IconMessage size={14} color="#1971c2" />
                          <Text size="xs" style={{ color: COLORS.TEXT.SECONDARY }}>
                            {collect.treasure.commentsCount}
                          </Text>
                        </Group>
                        <Group gap={4}>
                          <IconMapPin size={14} color="#2f9e44" />
                          <Text size="xs" style={{ color: COLORS.TEXT.SECONDARY }}>
                            {collect.treasure.address || '未知位置'}
                          </Text>
                        </Group>
                      </Group>

                      {/* 收集時間 */}
                      <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
                        收集於 {formatDate(collect.createdAt)}
                      </Text>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>

            {/* 分頁 */}
            {totalPages > 1 && (
              <Center mt="lg">
                <Pagination
                  value={currentPage}
                  onChange={handlePageChange}
                  total={totalPages}
                  size="sm"
                />
              </Center>
            )}
          </>
        )}

        {/* 空狀態 */}
        {!isLoading && ((mode !== 'collects' && treasures.length === 0) || (mode === 'collects' && collects.length === 0)) && !error && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text size="lg" style={{ color: COLORS.TEXT.SECONDARY }}>
                {mode === 'treasures' && '還沒有上傳任何寶藏'}
                {mode === 'favorites' && '還沒有收藏任何寶藏'}
                {mode === 'fragments' && '還沒有上傳任何碎片'}
                {mode === 'collects' && '還沒有收集任何寶藏'}
              </Text>
              <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
                {mode === 'treasures' && '開始探索並上傳你的第一個寶藏吧！'}
                {mode === 'favorites' && '去探索其他人的寶藏並加入收藏吧！'}
                {mode === 'fragments' && '開始分享你的生活碎片吧！'}
                {mode === 'collects' && '去尋找並收集隱藏的寶藏吧！'}
              </Text>
            </Stack>
          </Center>
        )}
      </Stack>

      {/* 編輯寶藏表單 */}
      {editingTreasure && (
        <TreasureForm
          mode="edit"
          opened={editFormOpened}
          onClose={() => {
            setEditFormOpened(false);
            setEditingTreasure(null);
          }}
          initialData={{
            title: editingTreasure.title,
            content: editingTreasure.content,
            type: editingTreasure.type as any,
            latitude: editingTreasure.latitude,
            longitude: editingTreasure.longitude,
            address: editingTreasure.address,
            amount: editingTreasure.amount,
            isPublic: editingTreasure.isPublic,
            isHidden: editingTreasure.isHidden,
            linkUrl: editingTreasure.linkUrl,
            tags: editingTreasure.tags,
            isLiveLocation: editingTreasure.isLiveLocation
          }}
          onSubmit={handleUpdateTreasure}
          onCancel={() => {
            setEditFormOpened(false);
            setEditingTreasure(null);
          }}
          isLoading={isUpdating}
        />
      )}
    </Modal>
  );
};

export default UserTreasuresModal;