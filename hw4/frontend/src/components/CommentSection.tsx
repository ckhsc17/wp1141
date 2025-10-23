import React, { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Text,
  Avatar,
  Textarea,
  Button,
  ActionIcon,
  Menu,
  Divider,
  Loader,
  Alert,
  Collapse,
  ScrollArea
} from '@mantine/core';
import {
  IconMessage,
  IconSend,
  IconDots,
  IconEdit,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconAlertCircle
} from '@tabler/icons-react';
import { commentService } from '@/services/commentService';
import { CommentDTO } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/utils/constants';

interface CommentSectionProps {
  treasureId: string;
  commentsCount: number;
  onCommentsCountChange?: (newCount: number) => void;
  compact?: boolean;
}

interface CommentItemProps {
  comment: CommentDTO;
  onEdit: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
  currentUserId?: string;
  compact?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onEdit,
  onDelete,
  currentUserId,
  compact = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOwner = currentUserId === comment.user.id;

  const handleEdit = async () => {
    if (editContent.trim() === comment.content.trim()) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('編輯留言失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('確定要刪除這則留言嗎？')) {
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('刪除留言失敗:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? '剛剛' : `${diffInMinutes}分鐘前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小時前`;
    } else {
      return date.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Group align="flex-start" gap="sm">
      <Avatar
        src={comment.user.avatar}
        alt={comment.user.name}
        size={compact ? "sm" : "md"}
        radius="xl"
      >
        {comment.user.name.charAt(0).toUpperCase()}
      </Avatar>
      
      <Stack gap="xs" style={{ flex: 1 }}>
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <Text 
              size={compact ? "xs" : "sm"} 
              fw={600}
              style={{ color: COLORS.TEXT.PRIMARY }}
            >
              {comment.user.name}
            </Text>
            <Text 
              size="xs" 
              style={{ color: COLORS.TEXT.MUTED }}
            >
              {formatDate(comment.createdAt)}
            </Text>
          </Group>
          
          {isOwner && (
            <Menu shadow="md" width={120}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="xs">
                  <IconDots size={12} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item 
                  leftSection={<IconEdit size={12} />}
                  onClick={() => setIsEditing(true)}
                >
                  編輯
                </Menu.Item>
                <Menu.Item 
                  leftSection={<IconTrash size={12} />}
                  color="red"
                  onClick={handleDelete}
                >
                  刪除
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {isEditing ? (
          <Stack gap="xs">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="編輯留言..."
              minRows={2}
              maxRows={4}
              size={compact ? "xs" : "sm"}
            />
            <Group gap="xs">
              <Button
                size="xs"
                onClick={handleEdit}
                loading={isSubmitting}
                disabled={!editContent.trim()}
              >
                保存
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isSubmitting}
              >
                取消
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text 
            size={compact ? "xs" : "sm"}
            style={{ 
              color: COLORS.TEXT.SECONDARY,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {comment.content}
          </Text>
        )}
      </Stack>
    </Group>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  treasureId,
  commentsCount,
  onCommentsCountChange,
  compact = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);

  // 載入留言
  const loadComments = async () => {
    if (hasLoadedComments) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await commentService.getCommentsByTreasureId(treasureId);
      console.log('Comments API response:', response);
      setComments(response?.comments || []);
      setHasLoadedComments(true);
    } catch (error) {
      console.error('載入留言失敗:', error);
      setError('載入留言失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 展開/收合留言區
  const toggleExpanded = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      await loadComments();
    } else {
      setIsExpanded(false);
    }
  };

  // 提交新留言
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      const comment = await commentService.createComment(treasureId, {
        content: newComment.trim()
      });
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      onCommentsCountChange?.(commentsCount + 1);
    } catch (error) {
      console.error('發送留言失敗:', error);
      setError('發送留言失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 編輯留言
  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      const updatedComment = await commentService.updateComment(commentId, newContent);
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
    } catch (error) {
      console.error('編輯留言失敗:', error);
      throw error;
    }
  };

  // 刪除留言
  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      onCommentsCountChange?.(commentsCount - 1);
    } catch (error) {
      console.error('刪除留言失敗:', error);
      throw error;
    }
  };

  return (
    <Stack gap="xs">
      <Divider />
      
      {/* 留言按鈕 */}
      <Group justify="space-between" align="center">
        <Button
          variant="subtle"
          size={compact ? "xs" : "sm"}
          leftSection={<IconMessage size={compact ? 12 : 14} />}
          rightSection={
            isExpanded ? 
              <IconChevronUp size={compact ? 12 : 14} /> : 
              <IconChevronDown size={compact ? 12 : 14} />
          }
          onClick={toggleExpanded}
          style={{ color: COLORS.TEXT.SECONDARY }}
        >
          {commentsCount > 0 ? `${commentsCount} 則留言` : '留言'}
        </Button>
      </Group>

      {/* 展開的留言區域 */}
      <Collapse in={isExpanded}>
        <Stack gap="md">
          {/* 新增留言 */}
          {isAuthenticated && (
            <Group align="flex-start" gap="sm">
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                size={compact ? "sm" : "md"}
                radius="xl"
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              
              <Stack gap="xs" style={{ flex: 1 }}>
                <Textarea
                  placeholder="寫下你的留言..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  minRows={2}
                  maxRows={4}
                  size={compact ? "xs" : "sm"}
                />
                <Group justify="flex-end">
                  <Button
                    size="xs"
                    leftSection={<IconSend size={12} />}
                    onClick={handleSubmitComment}
                    loading={isSubmitting}
                    disabled={!newComment.trim()}
                  >
                    發送
                  </Button>
                </Group>
              </Stack>
            </Group>
          )}

          {!isAuthenticated && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="blue"
              variant="light"
            >
              請登入後才能留言
            </Alert>
          )}

          {/* 錯誤提示 */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              onClose={() => setError(null)}
              withCloseButton
            >
              {error}
            </Alert>
          )}

          {/* 留言列表 */}
          {isLoading ? (
            <Group justify="center" p="md">
              <Loader size="sm" />
              <Text size="sm" style={{ color: COLORS.TEXT.MUTED }}>
                載入留言中...
              </Text>
            </Group>
          ) : (
            <ScrollArea.Autosize mah={compact ? 200 : 300}>
              <Stack gap="md">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      currentUserId={user?.id}
                      compact={compact}
                    />
                  ))
                ) : (
                  hasLoadedComments && (
                    <Text 
                      size="sm" 
                      ta="center" 
                      style={{ color: COLORS.TEXT.MUTED }}
                      p="md"
                    >
                      還沒有留言，成為第一個留言的人吧！
                    </Text>
                  )
                )}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Stack>
      </Collapse>
    </Stack>
  );
};

export default CommentSection;
