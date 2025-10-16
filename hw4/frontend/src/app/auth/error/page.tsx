'use client';

import { useSearchParams } from 'next/navigation';
import { Container, Title, Text, Button, Stack, Alert } from '@mantine/core';
import { IconAlertCircle, IconHome } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'missing_code':
        return '缺少授權碼，請重新嘗試登入';
      case 'no_id_token':
        return 'Google 未提供身份令牌，請重新嘗試';
      case 'invalid_token':
        return '身份令牌無效，請重新嘗試';
      case 'access_denied':
        return '您拒絕了授權請求，無法完成登入';
      default:
        return errorCode || '發生未知錯誤，請稍後再試';
    }
  };

  return (
    <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Stack gap="xl" w="100%">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="登入失敗"
          color="red"
          variant="filled"
        >
          {getErrorMessage(error)}
        </Alert>

        <Stack gap="md" align="center">
          <Title order={2} ta="center">
            登入遇到問題
          </Title>
          
          <Text ta="center" c="dimmed">
            請檢查您的網路連線並重新嘗試，或聯繫技術支援。
          </Text>

          <Button
            leftSection={<IconHome size={16} />}
            onClick={() => router.push('/')}
            size="lg"
          >
            返回首頁
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}