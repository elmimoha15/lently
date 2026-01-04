/**
 * React Query configuration and query keys
 */

export const queryKeys = {
  // User
  userProfile: ['user', 'profile'] as const,
  
  // Videos
  videos: ['videos'] as const,
  videoDetails: (videoId: string) => ['videos', videoId] as const,
  
  // Comments
  videoComments: (videoId: string, filters?: Record<string, any>) => 
    ['comments', videoId, filters] as const,
  allComments: (filters?: Record<string, any>) => 
    ['comments', 'all', filters] as const,
  
  // YouTube
  youtubeChannels: ['youtube', 'channels'] as const,
};

export const queryConfig = {
  defaultOptions: {
    queries: {
      // Stale-while-revalidate: Show cached data instantly, then refresh in background
      staleTime: 0, // Data becomes stale immediately
      gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: true, // Refresh when user returns to tab
      refetchOnMount: true, // Refresh when component mounts but show cached first
      refetchOnReconnect: true, // Refresh when internet reconnects
      retry: 1, // Only retry failed requests once
      retryDelay: 1000, // Wait 1 second before retry
      // Network mode: Show cached data even if offline
      networkMode: 'online' as const,
      // Placeholder data: Show cached data while fetching
      placeholderData: (previousData: any) => previousData,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};
