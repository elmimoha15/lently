import { useState, useEffect } from 'react';
import { getUserProfile, type UserProfile } from '@/lib/api/users';

/**
 * Hook to fetch and manage user profile
 * Returns profile data, loading state, and error state
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔵 Fetching user profile...');
        const data = await getUserProfile();
        
        if (mounted) {
          console.log('✅ User profile loaded:', data);
          setProfile(data);
        }
      } catch (err: any) {
        if (mounted) {
          console.error('❌ Error loading profile:', err);
          setError(err.message || 'Failed to load profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, refreshProfile };
}
