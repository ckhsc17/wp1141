import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

// Mock axios
vi.mock('../../api/axios');

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Not authenticated'));
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('should load user data on mount', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(api.get).mockResolvedValueOnce({
      data: { user: mockUser },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle login successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };

    // Mock initial refreshMe call
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Not authenticated'));
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock login call
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { user: mockUser },
    });

    await result.current.login('test@example.com', 'password123');

    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };

    // Mock initial user load
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { user: mockUser },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Mock logout
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

    await result.current.logout();

    expect(result.current.user).toBe(null);
  });
});


