'use client';

import React, { useState, useMemo } from 'react';
import {
  Container,
  Stack,
  Group,
  Button,
  Text,
  Alert,
  Loader,
  Center,
  Grid,
  ActionIcon,
  TextInput,
  Select,
  MultiSelect
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconLocation,
  IconAlertCircle
} from '@tabler/icons-react';
import { useTreasures } from '@/hooks/useTreasures';
import { useAuth } from '@/contexts/AuthContext';
import TreasureCard from '@/components/TreasureCard';
import TreasureForm from '@/components/TreasureForm';
import { TreasureType, TreasureQuery, CreateTreasureRequest } from '@/types';
import { TREASURE_TYPE_CONFIG, COLORS } from '@/utils/constants';

const TreasuresPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [formOpened, setFormOpened] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 使用 useMemo 來創建穩定的 query 物件
  const query = useMemo<TreasureQuery>(() => {
    const q: TreasureQuery = {};
    
    if (selectedType) {
      q.type = selectedType as TreasureType;
    }
    
    if (selectedTags.length > 0) {
      q.tags = selectedTags;
    }
    
    return q;
  }, [selectedType, selectedTags]);

  const {
    treasures,
    loading,
    error,
    pagination,
    refetch,
    loadMore,
    createTreasure,
    updateTreasure,
    deleteTreasure,
    likeTreasure,
    favoriteTreasure
  } = useTreasures(query);

  const handleCreateTreasure = async (data: CreateTreasureRequest) => {
    try {
      await createTreasure(data);
      setFormOpened(false);
    } catch (error) {
      console.error('創建寶藏失敗:', error);
    }
  };

  const handleSearch = () => {
    // 由於 query 現在是通過 useMemo 自動計算的，這裡不需要手動設定
    // 觸發重新獲取數據
    refetch();
  };

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedType(null);
    setSelectedTags([]);
    // refetch 會自動觸發，因為 query 依賴這些狀態
  };

  const treasureTypeOptions = Object.entries(TREASURE_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: `${config.icon} ${config.label}`
  }));

  if (loading && treasures.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: '50vh' }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>載入寶藏中...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* 標題和創建按鈕 */}
        <Group justify="space-between" align="center">
          <div>
            <Text size="xl" fw={700} style={{ color: COLORS.TEXT.SECONDARY }}>
              探索寶藏
            </Text>
            <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
              發現身邊的美好時光
            </Text>
          </div>
          
          {isAuthenticated && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setFormOpened(true)}
            >
              創建寶藏
            </Button>
          )}
        </Group>

        {/* 搜尋和篩選 */}
        <Group gap="md">
          <TextInput
            placeholder="搜尋寶藏..."
            leftSection={<IconSearch size={16} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1 }}
          />
          
          <Select
            placeholder="選擇類型"
            data={treasureTypeOptions}
            value={selectedType}
            onChange={setSelectedType}
            clearable
            w={200}
          />
          
          <MultiSelect
            placeholder="選擇標籤"
            data={[]} // 這裡可以從 API 獲取常用標籤
            value={selectedTags}
            onChange={setSelectedTags}
            searchable
            w={200}
          />
          
          <Button variant="filled" onClick={handleSearch}>
            搜尋
          </Button>
          
          <Button variant="outline" onClick={handleClearFilters}>
            清除
          </Button>
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

        {/* 寶藏列表 */}
        {treasures.length > 0 ? (
          <>
            <Grid>
              {treasures.map((treasure) => (
                <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} key={treasure.id}>
                  <TreasureCard
                    treasure={treasure}
                    onLike={likeTreasure}
                    onFavorite={favoriteTreasure}
                    onEdit={(treasure) => {
                      // TODO: 實作編輯功能
                      console.log('編輯寶藏:', treasure);
                    }}
                    onDelete={deleteTreasure}
                  />
                </Grid.Col>
              ))}
            </Grid>

            {/* 載入更多按鈕 */}
            {pagination && pagination.page < pagination.totalPages && (
              <Center>
                <Button
                  variant="outline"
                  onClick={loadMore}
                  loading={loading}
                >
                  載入更多
                </Button>
              </Center>
            )}
          </>
        ) : !loading && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text size="lg" style={{ color: COLORS.TEXT.SECONDARY }}>
                還沒有寶藏
              </Text>
              <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
                {isAuthenticated 
                  ? '成為第一個分享寶藏的人吧！' 
                  : '請登入後開始探索和分享寶藏'
                }
              </Text>
              {isAuthenticated && (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setFormOpened(true)}
                >
                  創建第一個寶藏
                </Button>
              )}
            </Stack>
          </Center>
        )}
      </Stack>

      {/* 創建寶藏表單 */}
      <TreasureForm
        mode="create"
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        onSubmit={handleCreateTreasure}
        onCancel={() => setFormOpened(false)}
      />
    </Container>
  );
};

export default TreasuresPage;