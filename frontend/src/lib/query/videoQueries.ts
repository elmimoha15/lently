import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserVideos, getVideoDetails, analyzeVideo, invalidateVideosCache, type Video } from '@/lib/api/videos';
import { queryKeys } from './config';
import { dataCache, CACHE_KEYS } from '@/lib/cache/dataCache';
import { toast } from 'sonner';

/**
 * Get all user videos with React Query
 * Uses stale-while-revalidate: shows cached data instantly, refetches in background
 */
export function useVideos() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.videos,
    queryFn: () => getUserVideos(),
    // Instantly show cached data if available
    initialData: () => {
      return queryClient.getQueryData(queryKeys.videos);
    },
    // Keep data fresh but allow instant navigation
    staleTime: 0, // Always refetch in background
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Get single video details with React Query
 * Uses stale-while-revalidate for instant loading
 */
export function useVideoDetails(videoId: string) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.videoDetails(videoId),
    queryFn: () => getVideoDetails(videoId),
    enabled: !!videoId,
    // Try to get initial data from videos list
    initialData: () => {
      const videos = queryClient.getQueryData<Video[]>(queryKeys.videos);
      return videos?.find((v) => v.id === videoId);
    },
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Analyze video mutation
 */
export function useAnalyzeVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (youtubeUrl: string) => analyzeVideo(youtubeUrl),
    onSuccess: () => {
      // Invalidate videos cache
      queryClient.invalidateQueries({ queryKey: queryKeys.videos });
      invalidateVideosCache();
      toast.success('Video analysis started');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start analysis');
    },
  });
}
