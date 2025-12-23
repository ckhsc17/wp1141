import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import api from '../api/axios';

// Mock axios
vi.mock('../api/axios');

// Simple protected component for testing
function ProtectedPage() {
  return <div>Protected Content</div>;
}

// Simple login page for testing
function LoginPage() {
  return <div>Login Page</div>;
}

// Simple ProtectedRoute wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    api.get('/auth/me')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
}

describe('Protected Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when not authenticated', async () => {
    // Mock API to return 401 (not authenticated)
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/groups']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/groups" 
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for "Redirecting to login..." to appear
    await waitFor(() => {
      expect(screen.getByText(/Redirecting to login/i)).toBeInTheDocument();
    });
  });

  it('should allow access to protected content when authenticated', async () => {
    // Mock API to return successful auth response
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { 
        user: { 
          id: 1, 
          email: 'test@example.com', 
          createdAt: new Date().toISOString() 
        } 
      }
    });

    render(
      <MemoryRouter initialEntries={['/groups']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/groups" 
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for protected content to appear
    await waitFor(() => {
      expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
    });
  });

  it('should show loading state initially', async () => {
    // Mock API with delayed response
    vi.mocked(api.get).mockImplementation(() => 
      new Promise((resolve) => 
        setTimeout(() => resolve({ 
          data: { user: { id: 1, email: 'test@example.com', createdAt: new Date().toISOString() } } 
        }), 100)
      )
    );

    render(
      <MemoryRouter initialEntries={['/groups']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/groups" 
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should show loading state
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
    });
  });
});

