import axios from 'axios';

// Debug: Log the API base URL to help diagnose issues
// IMPORTANT: Vite environment variables must be prefixed with VITE_ and are only available at build time
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Validate that we have a proper base URL
if (!apiBaseURL || apiBaseURL === 'undefined' || apiBaseURL.includes('undefined')) {
  console.error('[API] ERROR: Invalid API base URL:', apiBaseURL);
  console.error('[API] VITE_API_BASE_URL env var:', import.meta.env.VITE_API_BASE_URL);
  throw new Error('VITE_API_BASE_URL is not properly configured. Please set it in Vercel environment variables.');
}

console.log('[API] Base URL:', apiBaseURL);
console.log('[API] Environment variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
});

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

// Helper function to get auth token from sessionStorage (mobile fallback)
// sessionStorage is more secure than localStorage (cleared when tab closes)
function getAuthTokenFromStorage(): string | null {
  try {
    return sessionStorage.getItem('auth_token');
  } catch (error) {
    console.error('[API] Error reading auth token from sessionStorage:', error);
    return null;
  }
}

// Helper function to get auth token from cookie (fallback when sessionStorage is empty)
// This is needed when cookie is set but sessionStorage is not (e.g., desktop browser)
function getAuthTokenFromCookie(): string | null {
  try {
    if (typeof document === 'undefined') {
      return null;
    }
    
    // Parse cookies manually (since HttpOnly cookies can't be read via JavaScript)
    // But if cookie was set via JavaScript (non-HttpOnly), we can read it
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token' && value) {
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch (error) {
    console.error('[API] Error reading auth token from cookie:', error);
    return null;
  }
}

// Helper function to get guest token from localStorage for any event
function getGuestTokenForEvent(eventId: number | string): string | null {
  try {
    const storageKey = `event_${eventId}_member`;
    const storedMember = localStorage.getItem(storageKey);
    if (storedMember) {
      const memberData = JSON.parse(storedMember);
      return memberData.guestToken || null;
    }
  } catch (error) {
    console.error('Error reading guest token from localStorage:', error);
  }
  return null;
}

// Helper function to extract event ID from URL
function extractEventIdFromUrl(url: string): string | null {
  // Match patterns like:
  // /events/123/join
  // /events/123/poke
  // /events/123/location
  // /events/123/arrival
  const match = url.match(/\/events\/(\d+)(?:\/|$)/);
  return match ? match[1] : null;
}

// Request interceptor: Add Authorization header with guest token or auth token if available
api.interceptors.request.use(
  (config) => {
    // Priority 1: Check for guest token (for event-specific actions)
    const url = config.url || '';
    const eventId = extractEventIdFromUrl(url);
    
    if (eventId) {
      const guestToken = getGuestTokenForEvent(eventId);
      
      // Only add guest token if:
      // 1. We have a guest token
      // 2. No Authorization header is already set (don't override existing auth)
      if (guestToken && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${guestToken}`;
        return config;
      }
    }
    
    // Priority 2: Check for auth token from sessionStorage (mobile fallback)
    // Only use if no Authorization header is already set
    if (!config.headers['Authorization']) {
      let authToken = getAuthTokenFromStorage();
      
      // If not in sessionStorage, try to read from cookie (for desktop browsers)
      // Note: This only works if cookie is NOT HttpOnly (set via JavaScript)
      if (!authToken) {
        authToken = getAuthTokenFromCookie();
        if (authToken) {
          console.log('[API] Using auth token from cookie (desktop fallback)');
        }
      } else {
        console.log('[API] Using auth token from sessionStorage (mobile fallback)');
      }
      
      if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        // Debug: Log when no token found
        if (url === '/auth/me') {
          console.log('[API] No auth token found in sessionStorage or cookie, relying on HttpOnly cookie');
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;


