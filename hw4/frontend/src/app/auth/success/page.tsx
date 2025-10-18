'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Center, Loader, Text, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { API_ENDPOINTS } from '@/utils/constants';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`登入失敗: ${error}`);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!accessToken || !refreshToken) {
        setStatus('error');
        setMessage('未收到認證資訊');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        // 儲存 tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // 獲取用戶資訊
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.AUTH.PROFILE}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          setStatus('success');
          setMessage('登入成功！正在跳轉...');
          
          // 延遲跳轉到主頁
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          throw new Error('無法獲取用戶資訊');
        }
      } catch (err) {
        console.error('處理登入成功時發生錯誤:', err);
        setStatus('error');
        setMessage('處理登入資訊時發生錯誤');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleAuthSuccess();
  }, [searchParams, router]);

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
        {status === 'loading' && (
          <Box ta="center">
            <Loader size="lg" color="orange" mb="md" />
            <Text size="lg">正在處理登入資訊...</Text>
          </Box>
        )}
        
        {status === 'success' && (
          <Alert 
            icon={<IconCheck size={16} />} 
            color="green" 
            title="登入成功"
            variant="filled"
            style={{
              backgroundColor: 'rgba(52, 199, 89, 0.1)',
              border: '1px solid rgba(52, 199, 89, 0.3)',
              color: '#34C759'
            }}
          >
            {message}
          </Alert>
        )}
        
        {status === 'error' && (
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
            {message}
            <br />
            <Text size="sm" mt="sm">3秒後將返回登入頁面...</Text>
          </Alert>
        )}
      </Center>
    </Box>
  );
}