'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Center, Loader, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { API_ENDPOINTS } from '@/utils/constants';

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError('Google 授權被取消或失敗');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!code) {
        setError('未收到授權碼');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        // 將授權碼發送到後端進行處理
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.AUTH.GOOGLE_CALLBACK}?code=${code}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          // 後端會處理重導向，或者返回 tokens
          const result = await response.json();
          
          if (result.success && result.data) {
            // 如果後端返回用戶資料和 tokens
            localStorage.setItem('accessToken', result.data.accessToken);
            localStorage.setItem('refreshToken', result.data.refreshToken);
            router.push('/');
          } else {
            // 如果後端重導向處理
            router.push('/');
          }
        } else {
          throw new Error('後端處理失敗');
        }
      } catch (err) {
        console.error('Google 回調處理錯誤:', err);
        setError('登入處理失敗，請重試');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, login]);

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F1419 0%, #1a1a1a 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Center>
        {error ? (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            color="red" 
            title="登入失敗"
            variant="filled"
            style={{
              backgroundColor: 'rgba(255, 69, 58, 0.1)',
              border: '1px solid rgba(255, 69, 58, 0.3)',
              color: '#FF453A'
            }}
          >
            {error}
            <br />
            <Text size="sm" mt="sm">3秒後將返回登入頁面...</Text>
          </Alert>
        ) : (
          <Box ta="center">
            <Loader size="lg" color="orange" mb="md" />
            <Text size="lg">正在處理 Google 登入...</Text>
          </Box>
        )}
      </Center>
    </Box>
  );
}