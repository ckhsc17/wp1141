import React, { useState, useEffect } from 'react';
import {
  Modal,
  Avatar,
  Text,
  Group,
  Stack,
  Card,
  Grid,
  Badge,
  Button,
  Divider,
  Center,
  Loader,
  Alert
} from '@mantine/core';
import {
  IconUser,
  IconGift,
  IconHeart,
  IconMapPin,
  IconCalendar,
  IconMail,
  IconLogout,
  IconAlertCircle
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
}

interface UserStats {
  uploadedTreasures: number;
  favoritedTreasures: number;
  totalLikes: number;
  totalComments: number;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ opened, onClose }) => {
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取用戶統計資料
  const fetchUserStats = async () => {
    if (!user) return;
    
    setIsLoadingStats(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      } else {
        throw new Error('無法載入統計資料');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
      // 使用模擬資料
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
    <Modal
      opened={opened}
      onClose={onClose}
      title="個人資料"
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
                <IconMail size={16} color="gray" />
                <Text size="sm" c="dimmed">
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
          <Text size="lg" fw={600} mb="md">
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
                <Card withBorder p="md" ta="center">
                  <IconGift size={32} color="#FD7E14" style={{ margin: '0 auto 8px' }} />
                  <Text size="xl" fw={700} c="orange">
                    {stats.uploadedTreasures}
                  </Text>
                  <Text size="sm" c="dimmed">
                    已上傳寶藏
                  </Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Card withBorder p="md" ta="center">
                  <IconHeart size={32} color="#FF6B6B" style={{ margin: '0 auto 8px' }} />
                  <Text size="xl" fw={700} c="red">
                    {stats.favoritedTreasures}
                  </Text>
                  <Text size="sm" c="dimmed">
                    已收藏寶藏
                  </Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Card withBorder p="md" ta="center">
                  <IconHeart size={32} color="#51CF66" style={{ margin: '0 auto 8px' }} />
                  <Text size="xl" fw={700} c="green">
                    {stats.totalLikes}
                  </Text>
                  <Text size="sm" c="dimmed">
                    獲得讚數
                  </Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Card withBorder p="md" ta="center">
                  <IconMapPin size={32} color="#339AF0" style={{ margin: '0 auto 8px' }} />
                  <Text size="xl" fw={700} c="blue">
                    {stats.totalComments}
                  </Text>
                  <Text size="sm" c="dimmed">
                    留言數
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
  );
};

export default ProfileModal;