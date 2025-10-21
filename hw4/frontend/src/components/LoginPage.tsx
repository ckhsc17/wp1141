import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  PasswordInput,
  Stack,
  Group,
  Alert,
  Loader,
  Divider,
  Box,
  Center
} from '@mantine/core';
import { 
  IconBrandGoogle, 
  IconBrandFacebook, 
  IconBrandTwitter, 
  IconBrandGithub,
  IconDroplet,
  IconWallet,
  IconMap, 
  IconAlertCircle,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/utils/constants';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  
  const { login, loginWithPassword, register } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 直接重導向到後端的 Google OAuth 端點
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.AUTH.GOOGLE}`;
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : '登入失敗，請稍後再試');
    }
  };

  const handleTraditionalAuth = async () => {
    if (!formData.email || !formData.password) {
      setError('請填寫所有必填欄位');
      return;
    }

    if (!isLoginMode && !formData.name) {
      setError('請填寫姓名');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isLoginMode) {
        // 登入
        await loginWithPassword(formData.email, formData.password);
      } else {
        // 註冊
        await register(formData.name, formData.email, formData.password);
      }
      
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || '操作失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F1419 0%, #1a1a1a 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Container size="sm" style={{ position: 'relative', zIndex: 1, padding: '16px' }}>
        <Center style={{ minHeight: '100vh', padding: '16px 0' }}>
          <Stack gap="xl" w="100%" maw={400} style={{ width: '100%' }}>
            
            {/* Logo and Title */}
            <Center>
              <Stack gap="md" align="center">
                <Group gap="sm">
                  <IconMap size={48} color="#FD7E14" />
                  <Title 
                    order={1} 
                    c="white" 
                    style={{ 
                      fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                      fontWeight: 700,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      textAlign: 'center'
                    }}
                  >
                    尋寶地圖
                  </Title>
                </Group>
                <Text 
                  ta="center" 
                  size="lg"
                  style={{
                    maxWidth: '300px',
                    lineHeight: 1.6,
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    padding: '0 16px',
                    color: 'rgba(255, 255, 255, 0.8)' // 提高對比度
                  }}
                >
                  發現隱藏的寶藏，創造專屬回憶
                </Text>
              </Stack>
            </Center>

            {/* Mode Toggle */}
            <Center>
              <Title 
                order={3} 
                c="white" 
                mb="md"
                style={{
                  fontSize: 'clamp(1.2rem, 3vw, 1.5rem)'
                }}
              >
                {isLoginMode ? '登入' : '註冊'}
              </Title>
            </Center>

            {/* Error Message */}
            {error && (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                color="red" 
                title="錯誤"
                variant="filled"
                style={{
                  backgroundColor: 'rgba(255, 69, 58, 0.1)',
                  border: '1px solid rgba(255, 69, 58, 0.3)',
                  color: '#FF453A'
                }}
              >
                {error}
              </Alert>
            )}

            {/* Traditional Login Form */}
            <Stack gap="md">
              {!isLoginMode && (
                <TextInput
                  label="姓名"
                  placeholder="您的姓名"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  size="lg"
                  styles={{
                    label: { color: 'white', fontSize: '16px', marginBottom: '8px' },
                    input: {
                      backgroundColor: 'transparent',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '16px',
                      padding: '12px 16px',
                      '&:focus': {
                        borderColor: '#FD7E14',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      },
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }
                  }}
                />
              )}
              
              <TextInput
                label="Email"
                placeholder="您的 Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                size="lg"
                styles={{
                  label: { color: 'white', fontSize: '16px', marginBottom: '8px' },
                  input: {
                    backgroundColor: 'transparent',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '16px',
                    padding: '12px 16px',
                    '&:focus': {
                      borderColor: '#FD7E14',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    },
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }
                }}
              />
              
              <PasswordInput
                label="密碼"
                placeholder="您的密碼"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                size="lg"
                visibilityToggleIcon={({ reveal }) =>
                  reveal ? <IconEyeOff size={20} /> : <IconEye size={20} />
                }
                styles={{
                  label: { color: 'white', fontSize: '16px', marginBottom: '8px' },
                  input: {
                    backgroundColor: 'transparent',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '16px',
                    padding: '12px 16px',
                    '&:focus': {
                      borderColor: '#FD7E14',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    },
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  },
                  innerInput: {
                    backgroundColor: 'transparent',
                    color: 'white'
                  },
                  visibilityToggle: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: 'white'
                    }
                  }
                }}
              />

              {!isLoginMode && (
                <Text size="sm" ta="right" style={{ cursor: 'pointer', color: 'rgba(255, 255, 255, 0.7)' }}>
                  忘記密碼？
                </Text>
              )}
            </Stack>

            {/* Login/Register Button */}
            <Button
              size="lg"
              fullWidth
              onClick={handleTraditionalAuth}
              loading={isLoading}
              style={{
                background: 'linear-gradient(45deg, #FD7E14 0%, #FF922B 100%)',
                border: 'none',
                fontSize: '18px',
                fontWeight: 600,
                height: '52px',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FF922B 0%, #FD7E14 100%)'
                }
              }}
            >
              {isLoading ? '處理中...' : (isLoginMode ? '登入' : '註冊')}
            </Button>

            {/* Mode Switch */}
            <Center>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {isLoginMode ? '第一次使用尋寶地圖？' : '已經有帳號了？'}
                <Text
                  component="span"
                  c="orange"
                  td="underline"
                  ml={8}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsLoginMode(!isLoginMode)}
                >
                  {isLoginMode ? '註冊' : '登入'}
                </Text>
              </Text>
            </Center>

            {/* Divider */}
            <Divider 
              label="或是" 
              labelPosition="center" 
              styles={{
                label: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px' },
                root: { 
                  '&::before, &::after': { 
                    borderTopColor: 'rgba(255, 255, 255, 0.2)' 
                  }
                }
              }}
            />

            {/* OAuth Buttons */}
            <Stack gap="sm">
              <Text 
                ta="center" 
                size="sm" 
                style={{ marginBottom: '8px', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                繼續登入，代表您同意服務條款。
              </Text>

              <Button
                size="lg"
                fullWidth
                leftSection={<IconBrandGoogle size={20} />}
                onClick={handleGoogleLogin}
                variant="outline"
                disabled={isLoading}
                styles={{
                  root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    color: '#333',
                    fontSize: '16px',
                    height: '48px',
                    '&:hover': {
                      backgroundColor: 'white',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }
                  }
                }}
              >
                使用 Google 帳戶登入
              </Button>
            </Stack>
          </Stack>
        </Center>
      </Container>
    </Box>
  );
};

export default LoginPage;