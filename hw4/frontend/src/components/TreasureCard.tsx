import React from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
  Avatar,
  Menu,
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
  IconExternalLink
} from '@tabler/icons-react';
import { TreasureCardProps } from '@/types';
import { TREASURE_TYPE_CONFIG } from '@/utils/constants';
import { useAuth } from '@/contexts/AuthContext';

const TreasureCard: React.FC<TreasureCardProps> = ({
  treasure,
  onLike,
  onFavorite,
  onComment,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth();
  const typeConfig = TREASURE_TYPE_CONFIG[treasure.type];
  const isOwner = user?.id === treasure.user.id;

  const handleLike = () => {
    onLike?.(treasure.id);
  };

  const handleFavorite = () => {
    onFavorite?.(treasure.id);
  };

  const handleComment = () => {
    onComment?.(treasure.id);
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Text 
              size="lg" 
              style={{ 
                fontSize: rem(24),
                lineHeight: 1
              }}
            >
              {typeConfig.icon}
            </Text>
            <Badge 
              color={typeConfig.color}
              variant="light"
              size="sm"
            >
              {typeConfig.label}
            </Badge>
          </Group>
          
          {isOwner && (
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
      </Card.Section>

      <Stack gap="md" mt="md">
        <div>
          <Text fw={600} size="lg" mb={4}>
            {treasure.title}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={3}>
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
              <audio controls style={{ width: '100%' }}>
                <source src={treasure.mediaUrl} type="audio/mpeg" />
                您的瀏覽器不支援音頻播放
              </audio>
            ) : (
              <img 
                src={treasure.mediaUrl} 
                alt={treasure.title}
                style={{ 
                  maxWidth: '100%', 
                  borderRadius: '4px' 
                }}
              />
            )}
          </div>
        )}

        {treasure.tags.length > 0 && (
          <Group gap="xs">
            {treasure.tags.map((tag, index) => (
              <Badge 
                key={index}
                variant="outline" 
                size="xs"
                color="gray"
              >
                #{tag}
              </Badge>
            ))}
          </Group>
        )}

        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Avatar 
              src={treasure.user.avatar} 
              size={24}
              radius="xl"
            >
              {treasure.user.name.charAt(0)}
            </Avatar>
            <Text size="sm" c="dimmed">
              {treasure.user.name}
            </Text>
            <Text size="xs" c="dimmed">
              •
            </Text>
            <Text size="xs" c="dimmed">
              {formatDate(treasure.createdAt)}
            </Text>
          </Group>

          <Group gap="xs">
            <ActionIcon
              variant={treasure.isLiked ? 'filled' : 'subtle'}
              color={treasure.isLiked ? 'red' : 'gray'}
              onClick={handleLike}
              size="sm"
            >
              {treasure.isLiked ? (
                <IconHeartFilled size={16} />
              ) : (
                <IconHeart size={16} />
              )}
            </ActionIcon>
            <Text size="xs" c="dimmed">
              {treasure.likesCount}
            </Text>

            <ActionIcon
              variant={treasure.isFavorited ? 'filled' : 'subtle'}
              color={treasure.isFavorited ? 'yellow' : 'gray'}
              onClick={handleFavorite}
              size="sm"
            >
              {treasure.isFavorited ? (
                <IconBookmarkFilled size={16} />
              ) : (
                <IconBookmark size={16} />
              )}
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={handleComment}
              size="sm"
            >
              <IconMessage size={16} />
            </ActionIcon>
            <Text size="xs" c="dimmed">
              {treasure.commentsCount}
            </Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
};

export default TreasureCard;