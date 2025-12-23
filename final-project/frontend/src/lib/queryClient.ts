import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure React Query client
 * 
 * Default options:
 * - staleTime: 30 seconds - data stays fresh for 30s
 * - cacheTime: 5 minutes - cache is kept for 5min after component unmounts
 * - retry: 3 times - retry failed requests 3 times
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false, // Don't refetch on window focus (we use Pusher for real-time updates)
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});

