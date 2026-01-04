import { useState, useEffect, useCallback } from 'react';
import { getUserVideos, type Video } from '@/lib/api/videos';

interface UseVideosResult {
  videos: Video[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to fetch and manage user's videos
 */
export function useVideos(): UseVideosResult {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchVideos = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Fetching user videos...');
      const data = await getUserVideos(forceRefresh);
      
      console.log('✅ Videos loaded:', data.length);
      setVideos(data);
      
    } catch (err: any) {
      console.error('❌ Error loading videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(refreshKey > 0);
  }, [fetchVideos, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return { videos, loading, error, refresh };
}
