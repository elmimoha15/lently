import { useState, useEffect, useCallback } from 'react';
import { getUserVideos, type Video } from '@/lib/api/videos';
import { getUserProfile, type UserProfile } from '@/lib/api/users';

interface DashboardStats {
  totalVideos: number;
  totalComments: number;
  avgSentiment: number;
  flaggedComments: number;
  recentVideos: Video[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage dashboard data
 */
export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalComments: 0,
    avgSentiment: 0,
    flaggedComments: 0,
    recentVideos: [],
    loading: true,
    error: null,
  });
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔵 Fetching dashboard data...');
      
      // Fetch user profile and videos in parallel
      // Use skipCache on force refresh
      const [userProfile, videos] = await Promise.all([
        getUserProfile(forceRefresh),
        getUserVideos(forceRefresh),
      ]);
      
      console.log('✅ Dashboard data loaded:', { 
        profile: userProfile, 
        videoCount: videos.length 
      });
      
      // Calculate stats from videos
      const totalComments = videos.reduce((sum, v) => sum + (v.commentCount || 0), 0);
      const avgSentiment = videos.length > 0
        ? videos.reduce((sum, v) => sum + (v.avgSentiment || 0), 0) / videos.length
        : 0;
      
      // Get most recent videos (last 5)
      const recentVideos = videos
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      setProfile(userProfile);
      setStats({
        totalVideos: videos.length,
        totalComments,
        avgSentiment,
        flaggedComments: 0, // TODO: Get from comments API when available
        recentVideos,
        loading: false,
        error: null,
      });
      
    } catch (err: any) {
      console.error('❌ Error loading dashboard:', err);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load dashboard data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(refreshKey > 0);
  }, [fetchDashboardData, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return { ...stats, profile, refresh };
}
