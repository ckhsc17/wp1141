'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Loader } from '@mantine/core';
import { API_ENDPOINTS } from '@/utils/constants';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google 登入失敗:', error);
        router.push(`/auth/error?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!accessToken || !refreshToken) {
        console.error('未收到認證資訊');
        router.push('/auth/error?error=missing_tokens');
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
          
          // 直接跳轉到首頁，不顯示任何中間畫面
          router.push('/');
        } else {
          throw new Error('無法獲取用戶資訊');
        }
      } catch (err) {
        console.error('處理登入成功時發生錯誤:', err);
        router.push('/auth/error?error=profile_fetch_failed');
      }
    };

    handleAuthSuccess();
  }, [searchParams, router]);

  // 顯示一個極簡的載入畫面，用戶幾乎看不到就會跳轉
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Loader size="md" />
    </Box>
  );
}