import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import api from '../api/axios';

interface User {
  id: number;
  userId?: string | null; // User.userId (string identifier)
  email: string;
  name: string;
  avatar?: string | null;
  provider?: string | null;
  needsSetup?: boolean; // Whether user needs first-time setup
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  refreshUser: () => Promise<void>; // Alias for refreshMe
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      console.log('[Auth] Calling /auth/me to refresh user state');
      const response = await api.get('/auth/me');
      console.log('[Auth] /auth/me response:', {
        hasUser: !!response.data.user,
        userId: response.data.user?.id,
        email: response.data.user?.email,
      });
      setUser(response.data.user);
    } catch (error: any) {
      console.warn('[Auth] /auth/me failed:', {
        message: error?.message,
        response: error?.response?.data,
      });
      // Silently fail - user is not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);


  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    
    // Clear auth token from sessionStorage (mobile fallback)
    try {
      sessionStorage.removeItem('auth_token');
      console.log('[Auth] Cleared auth token from sessionStorage');
    } catch (error) {
      console.error('[Auth] Error clearing auth token from sessionStorage:', error);
    }
    
    // Also clear the cookie that was set via JavaScript (in App.tsx)
    // This is necessary because axios interceptor reads from cookie as fallback
    try {
      const isSecure = window.location.protocol === 'https:';
      // Clear cookie by setting it to empty with expired date
      // Try multiple variations to ensure it's cleared regardless of path/domain
      const cookieOptions = [
        `token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None${isSecure ? '; Secure' : ''}`,
        `token=; path=/; domain=${window.location.hostname}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      ];
      
      cookieOptions.forEach(cookieString => {
        document.cookie = cookieString;
      });
      
      console.log('[Auth] Cleared auth token cookie (JavaScript-set cookie)');
    } catch (error) {
      console.error('[Auth] Error clearing auth token cookie:', error);
    }
  }, []);

  useEffect(() => {
    refreshMe();
    
    // Listen for auth token updates (from temp token exchange)
    const handleAuthTokenUpdate = () => {
      console.log('[Auth] Auth token updated event received, refreshing user');
      refreshMe();
    };
    
    window.addEventListener('auth-token-updated', handleAuthTokenUpdate);
    
    return () => {
      window.removeEventListener('auth-token-updated', handleAuthTokenUpdate);
    };
  }, [refreshMe]);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, logout, refreshMe, refreshUser: refreshMe } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}