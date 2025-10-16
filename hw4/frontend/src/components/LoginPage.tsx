import React, { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Button,
  Container,
  Center,
  Stack,
  Group,
  Alert,
  Loader
} from '@mantine/core';
import { IconBrandGoogle, IconMap, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 這裡需要整合 Google OAuth
      // 暫時用模擬的方式
      console.log('開始 Google 登入流程...');
      
      // TODO: 實際的 Google OAuth 整合
      // const googleToken = await getGoogleToken();
      // await login(googleToken);
      
      // 模擬登入成功
      setTimeout(() => {
        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          router.push('/');
        }
      }, 2000);
      
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : '登入失敗，請稍後再試');
    }
  };

  return (
    <Container size="xs" style={{ minHeight: '100vh' }}>
      <Center style={{ minHeight: '100vh' }}>
        <Paper shadow="md" p="xl" radius="md" w="100%" maw={400}>
          <Stack gap="lg">
            {/* Logo 和標題 */}
            <Center>
              <Group gap="sm">
                <IconMap size={40} color="#FD7E14" />
                <Title order={2} c="orange">
                  尋寶地圖
                </Title>
              </Group>
            </Center>

            <Text ta="center" c="dimmed" size="sm">
              歡迎來到尋寶地圖！登入後開始你的尋寶之旅
            </Text>

            {/* 錯誤訊息 */}
            {error && (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                color="red" 
                title="登入失敗"
                variant="light"
              >
                {error}
              </Alert>
            )}

            {/* Google 登入按鈕 */}
            <Button
              size="lg"
              leftSection={
                isLoading ? (
                  <Loader size={20} color="white" />
                ) : (
                  <IconBrandGoogle size={20} />
                )
              }
              onClick={handleGoogleLogin}
              disabled={isLoading}
              fullWidth
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
            >
              {isLoading ? '登入中...' : '使用 Google 登入'}
            </Button>

            {/* 使用條款和隱私政策 */}
            <Text ta="center" size="xs" c="dimmed">
              登入即表示您同意我們的
              <Text component="a" c="blue" td="underline" style={{ cursor: 'pointer' }}>
                使用條款
              </Text>
              和
              <Text component="a" c="blue" td="underline" style={{ cursor: 'pointer' }}>
                隱私政策
              </Text>
            </Text>
          </Stack>
        </Paper>
      </Center>
    </Container>
  );
};

export default LoginPage;