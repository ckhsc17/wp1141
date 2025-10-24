import React, { useState } from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
  Avatar,
  Menu,
  Tooltip,
  rem
} from '@mantine/core';
import {
  IconHeart,
  IconHeartFilled,
  IconBookmark,
  IconBookmarkFilled,
  IconMessage,
  IconDots,
  IconEdit,
  IconTrash,
  IconExternalLink,
} from '@tabler/icons-react';
import { GiOpenChest, GiChest } from 'react-icons/gi';
import { TreasureCardProps, TreasureDTO } from '@/types';
import { TREASURE_TYPE_CONFIG, COLORS } from '@/utils/constants';
import { useAuth } from '@/contexts/AuthContext';
import CommentSection from './CommentSection';

// 寶藏卡片內容組件（不含外框）
interface TreasureCardContentProps {
  treasure: TreasureDTO;
  onLike?: (treasureId: string) => void;
  onFavorite?: (treasureId: string) => void;
  onComment?: (treasureId: string) => void;
  onCollect?: (treasureId: string) => void;
  onEdit?: (treasure: TreasureDTO) => void;
  onDelete?: (treasureId: string) => void;
  onCommentsCountChange?: (treasureId: string, newCount: number) => void;
  showOwnerMenu?: boolean;
  compact?: boolean; // 緊湊模式，用於 InfoWindow
  showComments?: boolean; // 是否顯示留言區塊
}

export const TreasureCardContent: React.FC<TreasureCardContentProps> = ({
  treasure,
  onLike,
  onFavorite,
  onComment,
  onCollect,
  onEdit,
  onDelete,
  onCommentsCountChange,
  showOwnerMenu = true,
  compact = false,
  showComments = false
}) => {
  const { user } = useAuth();
  const typeConfig = TREASURE_TYPE_CONFIG[treasure.type];
  const isOwner = user?.id === treasure.user.id;
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

  const handleLike = () => {
    onLike?.(treasure.id);
  };

  const handleFavorite = () => {
    onFavorite?.(treasure.id);
  };

  const handleComment = () => {
    // 切換留言區展開狀態
    setIsCommentsExpanded(!isCommentsExpanded);
    onComment?.(treasure.id);
  };

  const handleCollect = () => {
    console.log("更新 handleCollect 狀態")
    onCollect?.(treasure.id);
  };

  const handleEdit = () => {
    onEdit?.(treasure);
  };

  const handleDelete = () => {
    onDelete?.(treasure.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: compact ? undefined : 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* 標題區域 */}
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Text 
            size={compact ? "md" : "lg"} 
            style={{ 
              fontSize: compact ? rem(20) : rem(24),
              lineHeight: 1
            }}
          >
            {typeConfig.icon}
          </Text>
          <Badge 
            color={typeConfig.color}
            variant="light"
            size={compact ? "xs" : "sm"}
          >
            {typeConfig.label}
          </Badge>
        </Group>
        
        {showOwnerMenu && isOwner && (
          <Menu shadow="md" width={120}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item 
                leftSection={<IconEdit size={14} />}
                onClick={handleEdit}
              >
                編輯
              </Menu.Item>
              <Menu.Item 
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={handleDelete}
              >
                刪除
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <Stack gap={compact ? "xs" : "md"}>
        <div>
          <Text fw={600} size={compact ? "md" : "lg"} mb={4}>
            {treasure.title}
          </Text>
          <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }} lineClamp={compact ? 2 : 3}>
            {treasure.content}
          </Text>
        </div>

        {treasure.linkUrl && (
          <Group gap="xs">
            <IconExternalLink size={16} />
            <Text 
              size="sm" 
              c="blue" 
              component="a" 
              href={treasure.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              td="underline"
            >
              查看連結
            </Text>
          </Group>
        )}

        {treasure.mediaUrl && (
          <div>
            {treasure.type === 'music' || treasure.type === 'audio' ? (
              <audio controls style={{ width: '100%', height: compact ? '28px' : 'auto' }}>
                <source src={treasure.mediaUrl} type="audio/mpeg" />
                您的瀏覽器不支援音頻播放
              </audio>
            ) : (
              <img 
                src={treasure.mediaUrl} 
                alt={treasure.title}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: compact ? '100px' : 'auto',
                  borderRadius: '4px',
                  objectFit: 'cover'
                }}
              />
            )}
          </div>
        )}

        {treasure.tags.length > 0 && (
          <Group gap="xs">
            {treasure.tags.slice(0, compact ? 2 : treasure.tags.length).map((tag, index) => (
              <Badge 
                key={index}
                variant="outline" 
                size="xs"
                color="gray"
              >
                #{tag}
              </Badge>
            ))}
            {compact && treasure.tags.length > 2 && (
              <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>+{treasure.tags.length - 2}</Text>
            )}
          </Group>
        )}

        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Avatar 
              src={treasure.user.avatar} 
              size={compact ? 20 : 24}
              radius="xl"
            >
              {treasure.user.name.charAt(0)}
            </Avatar>
            <Text size={compact ? "xs" : "sm"} style={{ color: COLORS.TEXT.SECONDARY }}>
              {treasure.user.name}
            </Text>
            <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
              •
            </Text>
            <Text size="xs" style={{ color: COLORS.TEXT.MUTED }}>
              {formatDate(treasure.createdAt)}
            </Text>
          </Group>

          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={handleLike}
              size="sm"
            >
              {treasure.isLiked ? (
                <IconHeartFilled 
                  size={compact ? 14 : 16} 
                  color={COLORS.ICON.HEART}
                />
              ) : (
                <IconHeart 
                  size={compact ? 14 : 16} 
                  color={COLORS.ICON.DEFAULT}
                />
              )}
            </ActionIcon>
            <Text size="xs" style={{ color: COLORS.TEXT.SECONDARY }}>
              {treasure.likesCount}
            </Text>

            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={handleFavorite}
              size="sm"
            >
              {treasure.isFavorited ? (
                <IconBookmarkFilled 
                  size={compact ? 14 : 16} 
                  color={COLORS.ICON.BOOKMARK}
                />
              ) : (
                <IconBookmark 
                  size={compact ? 14 : 16} 
                  color={COLORS.ICON.DEFAULT}
                />
              )}
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={handleComment}
              size="sm"
            >
              <IconMessage 
                size={compact ? 14 : 16} 
                color={COLORS.ICON.DEFAULT}
              />
            </ActionIcon>
            <Text size="xs" style={{ color: COLORS.TEXT.SECONDARY }}>
              {treasure.commentsCount}
            </Text>

            {/* 收集寶藏按鈕 - 只在寶藏可收集時顯示 */}
            {treasure.isHidden !== null && treasure.isHidden !== undefined && (
              <Tooltip label={treasure.isCollected ? '取消收集寶藏' : '收集寶藏'} withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={handleCollect}
                size="sm"
              >
                {treasure.isCollected ? (
                  <GiChest
                    size={compact ? 14 : 16} 
                    color="#f59e0b" // amber color for collected
                  />
                ) : (
                  <GiOpenChest 
                    size={compact ? 14 : 16} 
                    color={COLORS.ICON.DEFAULT}
                  />
                )}
              </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Stack>

      {/* 留言區塊 */}
      {showComments && (
        <CommentSection
          treasureId={treasure.id}
          commentsCount={treasure.commentsCount}
          onCommentsCountChange={(newCount) => onCommentsCountChange?.(treasure.id, newCount)}
          compact={compact}
          isExpanded={isCommentsExpanded}
          onToggleExpanded={() => setIsCommentsExpanded(!isCommentsExpanded)}
        />
      )}
    </>
  );
};

const TreasureCard: React.FC<TreasureCardProps> = ({
  treasure,
  onLike,
  onFavorite,
  onComment,
  onEdit,
  onDelete
}) => {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <TreasureCardContent
        treasure={treasure}
        onLike={onLike}
        onFavorite={onFavorite}
        onComment={onComment}
        onEdit={onEdit}
        onDelete={onDelete}
        showOwnerMenu={true}
        compact={false}
      />
    </Card>
  );
};

export default TreasureCard;