import { useState, useEffect, useCallback } from 'react';
import { getUserVideos } from '@/lib/api/videos';
import { getVideoComments, type Comment, type CommentFilters } from '@/lib/api/comments';

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  total: number;
  refresh: () => void;
  applyFilters: (filters: CommentFilters) => void;
}

/**
 * Hook to fetch and manage comments from all user videos
 */
export function useComments(): UseCommentsResult {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<CommentFilters>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchComments = useCallback(async (filters: CommentFilters = {}, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Fetching comments...');
      
      // First, get all user videos (from cache if available)
      const videos = await getUserVideos(forceRefresh);
      
      if (videos.length === 0) {
        console.log('⚠️  No videos found');
        setComments([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      
      // Fetch comments from all videos in parallel for better performance
      // Only skip cache if forcing refresh and no filters
      const hasFilters = Object.keys(filters).length > 0;
      const commentPromises = videos.map(video => 
        getVideoComments(video.id, {
          ...filters,
          limit: 100, // Get up to 100 comments per video
        }, forceRefresh && !hasFilters).catch(err => {
          console.error(`Failed to fetch comments for video ${video.id}:`, err);
          return { comments: [], total: 0, page: 1, limit: 100, hasMore: false };
        })
      );
      
      const responses = await Promise.all(commentPromises);
      const allComments = responses.flatMap(response => response.comments);
      
      console.log('✅ Comments loaded:', allComments.length);
      setComments(allComments);
      setTotal(allComments.length);
      
    } catch (err: any) {
      console.error('❌ Error loading comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments(currentFilters, refreshKey > 0);
  }, [fetchComments, currentFilters, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const applyFilters = useCallback((filters: CommentFilters) => {
    setCurrentFilters(filters);
  }, []);

  return { comments, loading, error, total, refresh, applyFilters };
}
