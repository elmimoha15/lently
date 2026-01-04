import { apiFetch } from './client';
import { dataCache, CACHE_KEYS } from '@/lib/cache/dataCache';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string | null;
  plan: 'free' | 'starter' | 'pro' | 'business';
  planExpiry: string | null;
  videosAnalyzed: number;
  commentsAnalyzed: number;
  createdAt: string;
}

/**
 * Check if user exists in backend (returns 404 if not)
 */
export async function checkUserExists(): Promise<boolean> {
  try {
    await apiFetch<UserProfile>('/api/users/profile');
    return true;
  } catch (error) {
    // 404 means user doesn't exist
    return false;
  }
}

/**
 * Get user profile (with caching)
 */
export async function getUserProfile(skipCache = false): Promise<UserProfile> {
  // Check cache first
  if (!skipCache) {
    const cached = dataCache.get<UserProfile>(CACHE_KEYS.USER_PROFILE);
    if (cached) {
      return cached;
    }
  }

  // Fetch from API and cache
  const profile = await apiFetch<UserProfile>('/api/users/profile');
  dataCache.set(CACHE_KEYS.USER_PROFILE, profile);
  return profile;
}

/**
 * Initialize/create user in backend
 */
export async function initializeUser(): Promise<UserProfile> {
  const profile = await apiFetch<UserProfile>('/api/users/init', {
    method: 'POST',
  });
  // Cache the new profile
  dataCache.set(CACHE_KEYS.USER_PROFILE, profile);
  return profile;
}

/**
 * Update user's subscription plan
 */
export async function updateUserPlan(plan: 'free' | 'starter' | 'pro' | 'business'): Promise<UserProfile> {
  const profile = await apiFetch<UserProfile>('/api/users/plan', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan }),
  });
  // Invalidate profile cache
  dataCache.invalidate(CACHE_KEYS.USER_PROFILE);
  dataCache.set(CACHE_KEYS.USER_PROFILE, profile);
  return profile;
}

