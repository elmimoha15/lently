import { auth } from '@/lib/firebase/config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token cache to avoid repeated getIdToken() calls
let tokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Get authentication headers with Firebase ID token (with caching)
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if we have a valid cached token (expires in 55 minutes, tokens last 1 hour)
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) {
    return {
      'Authorization': `Bearer ${tokenCache.token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get fresh token and cache it
  const token = await user.getIdToken(false); // false = use cached token if available
  tokenCache = {
    token,
    expiresAt: now + (55 * 60 * 1000), // Cache for 55 minutes
  };
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Clear token cache (call on sign out or token errors)
 */
export function clearTokenCache() {
  tokenCache = null;
}

/**
 * API fetch wrapper with authentication
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // If unauthorized, clear token cache and let user re-authenticate
    if (response.status === 401) {
      clearTokenCache();
    }
    
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Axios-like API client for convenience
 */
export const api = {
  get: async <T>(endpoint: string): Promise<{ data: T }> => {
    const data = await apiFetch<T>(endpoint, { method: 'GET' });
    return { data };
  },
  
  post: async <T>(endpoint: string, body?: any): Promise<{ data: T }> => {
    const data = await apiFetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  
  put: async <T>(endpoint: string, body?: any): Promise<{ data: T }> => {
    const data = await apiFetch<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  
  delete: async <T>(endpoint: string): Promise<{ data: T }> => {
    const data = await apiFetch<T>(endpoint, { method: 'DELETE' });
    return { data };
  },
};
