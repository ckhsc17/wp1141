import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Group,
  Avatar,
  Badge,
  Button,
  Stack,
  Grid,
  Card,
  Title,
  Divider,
  ActionIcon,
  Tooltip,
  Alert,
  Loader,
  Center
} from '@mantine/core';
import {
  IconTrophy,
  IconHeart,
  IconMessage,
  IconMapPin,
  IconSettings,
  IconEdit,
  IconLogout,
  IconAlertCircle,
  IconUser,
  IconMail,
  IconBookmark,
} from '@tabler/icons-react';
import { FaPuzzlePiece } from 'react-icons/fa';
import { GiOpenChest, GiArchiveRegister, GiChest } from 'react-icons/gi';
import { useAuth } from '@/contexts/AuthContext';
import { userService, UserStats } from '@/services/userService';
import UserTreasuresModal from './UserTreasuresModal';
import { COLORS } from '@/utils/constants';

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ opened, onClose }) => {
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UserTreasuresModal 狀態
  const [treasuresModalOpened, setTreasuresModalOpened] = useState(false);
  const [treasuresModalMode, setTreasuresModalMode] = useState<'treasures' | 'favorites'>('treasures');

  // 獲取用戶統計資料
  const fetchUserStats = async () => {
    if (!user) return;
    
    setIsLoadingStats(true);
    setError(null);
    
    try {
      const statsData = await userService.getUserStats();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
      console.error('獲取統計資料失敗:', err);
      
      // 使用模擬資料作為備用
      setStats({
        uploadedTreasures: 12,
        favoritedTreasures: 25,
        totalLikes: 148,
        totalComments: 67
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (opened && user) {
      fetchUserStats();
    }
  }, [opened, user]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title="個人資料" style={{ color: COLORS.TEXT.SECONDARY }}
        size="md"
        centered
      >
      <Stack gap="lg">
        {/* 用戶基本資訊 */}
        <Card withBorder p="lg">
          <Group>
            <Avatar
              src={user.avatar}
              size="xl"
              radius="50%"
              color="blue"
            >
              <IconUser size={40} />
            </Avatar>
            
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text size="xl" fw={600}>
                {user.name}
              </Text>
              <Group gap="xs">
                <IconMail size={16} color={COLORS.ICON.DEFAULT} />
                <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
                  {user.email}
                </Text>
              </Group>
              {/* 移除創建日期顯示，因為 UserDTO 沒有這個欄位 */}
            </Stack>
          </Group>
        </Card>

        <Divider />

        {/* 統計資料 */}
        <div>
          <Text size="lg" fw={600} mb="md" style={{ color: COLORS.TEXT.SECONDARY }}>
            我的數據
          </Text>
          
          {error && (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              color="red" 
              mb="md"
              variant="light"
            >
              {error}
            </Alert>
          )}

          {isLoadingStats ? (
            <Center py="xl">
              <Loader size="md" />
            </Center>
          ) : stats ? (
            <Grid>
              <Grid.Col span={6}>
                <Card 
                  withBorder 
                  p="md" 
                  ta="center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setTreasuresModalMode('treasures');
                    setTreasuresModalOpened(true);
                  }}
                >
                  <GiOpenChest size={32} color="#FD7E14" style={{ margin: '0 auto 8px' }} />
                  <Text size="xl" fw={700} c="orange">
                    {stats.uploadedTreasures}
                  </Text>
                  <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
                    已上傳寶藏
                  </Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Card 
                  withBorder 
                  p="md" 
                  ta="center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setTreasuresModalMode('favorites');
                    setTreasuresModalOpened(true);
                  }}
                >
                  <IconBookmark size={32} color="#51CF66" style={{ margin: '0 auto 8px' }} />
                  <Text size="xl" fw={700} c="green">
                    {stats.favoritedTreasures}
                  </Text>
                  <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
                    已收藏寶藏
                  </Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Card withBorder p="md" ta="center">
                  <FaPuzzlePiece size={32} color="#228be6" style={{ margin: '0 auto 8px' }} />
                  <Text size="xl" fw={700} c="blue">
                    {stats.totalLikes}
                  </Text>
                  <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
                    已上傳碎片
                  </Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Card withBorder p="md" ta="center">
                  <IconTrophy size={32} color="#f1c40f" style={{ margin: '0 auto 8px' }} />
                  <Text size="xl" fw={700} c="gold">
                    {stats.totalComments}
                  </Text>
                  <Text size="sm" style={{ color: COLORS.TEXT.SECONDARY }}>
                    已獲得寶藏
                  </Text>
                </Card>
              </Grid.Col>
            </Grid>
          ) : null}
        </div>

        <Divider />

        {/* 操作按鈕 */}
        <Group justify="space-between">
          <Button
            variant="light"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            登出
          </Button>
          
          <Button
            variant="light"
            onClick={onClose}
          >
            關閉
          </Button>
        </Group>
      </Stack>
      </Modal>

      {/* UserTreasuresModal */}
      <UserTreasuresModal
        opened={treasuresModalOpened}
        onClose={() => setTreasuresModalOpened(false)}
        mode={treasuresModalMode}
      />
    </>
  );
};

export default ProfileModal;