import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserDTO } from '@/types';

interface AuthContextType {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 檢查本地存儲的 token 並驗證
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            setUser(result.data);
          } else {
            // Token 無效，清除本地存儲
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (error) {
          console.error('驗證失敗:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (googleToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ googleToken })
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data.user);
        localStorage.setItem('accessToken', result.data.accessToken);
        localStorage.setItem('refreshToken', result.data.refreshToken);
      } else {
        throw new Error('登入失敗');
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setUser(result.data);
        }
      } catch (error) {
        console.error('刷新用戶資訊失敗:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};