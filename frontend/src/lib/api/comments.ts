import { apiFetch } from './client';
import { dataCache, CACHE_KEYS } from '@/lib/cache/dataCache';

export interface Comment {
  id: string; // Firestore document ID (same as youtubeCommentId)
  videoId: string;
  youtubeCommentId: string; // YouTube's comment ID
  author: string; // Display name
  text: string;
  likeCount: number;
  publishedAt: string;
  category?: string;
  sentimentScore?: number;
  sentimentLabel?: string;
  toxicityScore?: number;
  extractedQuestion?: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CommentFilters {
  category?: string;
  sentiment?: string;
  minToxicity?: number;
  search?: string;
  sortBy?: string;
  order?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get comments for a specific video (with caching)
 */
export async function getVideoComments(
  videoId: string,
  filters?: CommentFilters,
  skipCache = false
): Promise<CommentsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.category) params.append('category', filters.category);
  if (filters?.sentiment) params.append('sentiment', filters.sentiment);
  if (filters?.minToxicity !== undefined) params.append('minToxicity', filters.minToxicity.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.order) params.append('order', filters.order);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());
  
  const queryString = params.toString();
  const url = `/api/videos/${videoId}/comments${queryString ? `?${queryString}` : ''}`;
  
  // Only cache if no filters applied
  const cacheKey = CACHE_KEYS.VIDEO_COMMENTS(videoId);
  if (!skipCache && !queryString) {
    const cached = dataCache.get<CommentsResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  const response = await apiFetch<CommentsResponse>(url);
  
  // Only cache unfiltered results
  if (!queryString) {
    dataCache.set(cacheKey, response);
  }
  
  return response;
}

/**
 * Invalidate comments cache (call after new analysis)
 */
export function invalidateCommentsCache(videoId?: string): void {
  if (videoId) {
    dataCache.invalidate(CACHE_KEYS.VIDEO_COMMENTS(videoId));
  } else {
    dataCache.invalidatePattern('comments:');
  }
  dataCache.invalidate(CACHE_KEYS.ALL_COMMENTS);
}
