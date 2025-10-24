import React from 'react';
import {
  Drawer,
  Stack,
  Text,
  Card,
  Group,
  Badge,
  ActionIcon,
  Button,
  Divider,
  ScrollArea
} from '@mantine/core';
import {
  IconMapPin,
  IconX,
  IconHeart,
  IconMessage,
  IconBookmark,
  IconBookmarkFilled,
  IconThumbUp,
  IconThumbUpFilled
} from '@tabler/icons-react';
// PlaceSearchResult 現在定義在 page.tsx 中
interface PlaceSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
}
import { TreasureDTO } from '@/types';
import { COLORS } from '@/utils/constants';

interface SearchResultsSidebarProps {
  opened: boolean;
  onClose: () => void;
  searchQuery: string;
  searchResults: (PlaceSearchResult | TreasureDTO)[];
  isLoading: boolean;
  onPlaceClick: (place: PlaceSearchResult) => void;
  onTreasureClick: (treasure: TreasureDTO) => void;
  onLike?: (treasureId: string) => void;
  onFavorite?: (treasureId: string) => void;
  onComment?: (treasureId: string) => void;
}

export default function SearchResultsSidebar({
  opened,
  onClose,
  searchQuery,
  searchResults,
  isLoading,
  onPlaceClick,
  onTreasureClick,
  onLike,
  onFavorite,
  onComment
}: SearchResultsSidebarProps) {
  const isPlaceResult = (result: PlaceSearchResult | TreasureDTO): result is PlaceSearchResult => {
    return 'placeId' in result;
  };

  const isTreasureResult = (result: PlaceSearchResult | TreasureDTO): result is TreasureDTO => {
    return 'id' in result && 'title' in result && 'content' in result;
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="md"
      position="left"
      styles={{
        header: {
          borderBottom: '1px solid #e9ecef',
          paddingBottom: '1rem',
          marginTop: '80px !important' // 為上方按鈕預留空間，使用 !important 確保樣式生效
        },
        body: {
          paddingTop: '1rem'
        },
        content: {
          marginTop: '80px !important' // 同時設定 content 的 marginTop
        }
      }}
    >
      <Stack gap="md" style={{ paddingTop: '80px' }}>
        {/* 搜尋查詢顯示 */}
        <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
          搜尋「{searchQuery}」的結果
        </Text>

        {/* 載入狀態 */}
        {isLoading && (
          <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
            搜尋中...
          </Text>
        )}

        {/* 搜尋結果 */}
        {!isLoading && searchResults.length === 0 && (
          <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
            沒有找到相關結果
          </Text>
        )}

        {!isLoading && searchResults.length > 0 && (
          <ScrollArea.Autosize mah={600}>
            <Stack gap="md">
              {searchResults.map((result, index) => {
                if (isPlaceResult(result)) {
                  // 地點搜尋結果
                  return (
                    <Card
                      key={`place-${result.placeId}`}
                      shadow="sm"
                      padding="md"
                      radius="md"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onPlaceClick(result)}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Group gap="xs">
                            <IconMapPin size={16} style={{ color: COLORS.ICON.DEFAULT }} />
                            <Text fw={600} size="sm">
                              {result.name}
                            </Text>
                          </Group>
                          <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
                            {result.address}
                          </Text>
                          <Badge size="xs" variant="light" color="blue">
                            地點
                          </Badge>
                        </Stack>
                      </Group>
                    </Card>
                  );
                } else if (isTreasureResult(result)) {
                  // 寶藏搜尋結果
                  return (
                    <Card
                      key={`treasure-${result.id}`}
                      shadow="sm"
                      padding="md"
                      radius="md"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onTreasureClick(result)}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" align="flex-start">
                          <Text fw={600} size="sm" style={{ flex: 1 }}>
                            {result.title}
                          </Text>
                          <Badge size="xs" variant="light" color="green">
                            {result.type === 'live_moment' ? '活在當下' : '寶藏'}
                          </Badge>
                        </Group>
                        
                        <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
                          {result.content.length > 100 
                            ? `${result.content.substring(0, 100)}...` 
                            : result.content
                          }
                        </Text>
                        
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLike?.(result.id);
                            }}
                          >
                            {result.isLiked ? (
                              <IconThumbUpFilled size={14} style={{ color: COLORS.ICON.HEART }} />
                            ) : (
                              <IconThumbUp size={14} style={{ color: COLORS.ICON.DEFAULT }} />
                            )}
                          </ActionIcon>
                          <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
                            {result.likesCount}
                          </Text>
                          
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFavorite?.(result.id);
                            }}
                          >
                            {result.isFavorited ? (
                              <IconBookmarkFilled size={14} style={{ color: COLORS.ICON.BOOKMARK }} />
                            ) : (
                              <IconBookmark size={14} style={{ color: COLORS.ICON.DEFAULT }} />
                            )}
                          </ActionIcon>
                          
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onComment?.(result.id);
                            }}
                          >
                            <IconMessage size={14} style={{ color: COLORS.ICON.DEFAULT }} />
                          </ActionIcon>
                          <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
                            {result.commentsCount}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  );
                }
                return null;
              })}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Stack>
    </Drawer>
  );
}

