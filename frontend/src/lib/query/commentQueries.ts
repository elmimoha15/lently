import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVideoComments, type CommentFilters } from '@/lib/api/comments';
import { getUserVideos } from '@/lib/api/videos';
import { queryKeys } from './config';

/**
 * Get comments for a specific video with React Query
 */
export function useVideoComments(videoId: string, filters?: CommentFilters) {
  return useQuery({
    queryKey: queryKeys.videoComments(videoId, filters),
    queryFn: () => getVideoComments(videoId, filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled: !!videoId,
  });
}

/**
 * Get all comments from all user videos with React Query
 */
export function useAllComments(filters?: CommentFilters) {
  return useQuery({
    queryKey: queryKeys.allComments(filters),
    queryFn: async () => {
      // Get all videos first
      const videos = await getUserVideos();
      
      if (videos.length === 0) {
        return [];
      }

      // Fetch comments from all videos in parallel
      const commentPromises = videos.map(video =>
        getVideoComments(video.id, {
          ...filters,
          limit: 100,
        }).catch(err => {
          console.error(`Failed to fetch comments for video ${video.id}:`, err);
          return { comments: [], total: 0, page: 1, limit: 100, hasMore: false };
        })
      );

      const responses = await Promise.all(commentPromises);
      return responses.flatMap(response => response.comments);
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
