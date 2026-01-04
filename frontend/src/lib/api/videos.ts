import { apiFetch } from './client';
import { dataCache, CACHE_KEYS } from '@/lib/cache/dataCache';

export interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  duration: string;
}

export interface AnalyzeResponse {
  jobId: string;
  videoId: string;
  message: string;
}

export interface JobStatus {
  jobId: string;
  videoId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalComments: number;
  processedComments: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  avgSentiment: number;
  createdAt: string;
  stats?: {
    questions: number;
    praise: number;
    complaints: number;
    suggestions: number;
    spam: number;
    toxic: number;
  };
}

/**
 * Validate YouTube URL and get video metadata
 */
export async function validateVideoUrl(youtubeUrl: string): Promise<VideoMetadata> {
  return apiFetch<VideoMetadata>('/api/videos/validate', {
    method: 'POST',
    body: JSON.stringify({ youtubeUrl }),
  });
}

/**
 * Start video analysis
 */
export async function analyzeVideo(youtubeUrl: string): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>('/api/videos/analyze', {
    method: 'POST',
    body: JSON.stringify({ youtubeUrl }),
  });
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return apiFetch<JobStatus>(`/api/videos/sync-jobs/${jobId}`);
}

/**
 * Get all user videos (with caching)
 */
export async function getUserVideos(skipCache = false): Promise<Video[]> {
  // Check cache first
  if (!skipCache) {
    const cached = dataCache.get<Video[]>(CACHE_KEYS.USER_VIDEOS);
    if (cached) {
      return cached;
    }
  }

  // Fetch from API and cache
  const videos = await apiFetch<Video[]>('/api/videos');
  dataCache.set(CACHE_KEYS.USER_VIDEOS, videos);
  return videos;
}

/**
 * Get video details (with caching)
 */
export async function getVideoDetails(videoId: string, skipCache = false): Promise<Video> {
  const cacheKey = CACHE_KEYS.VIDEO_DETAILS(videoId);
  
  // Check cache first
  if (!skipCache) {
    const cached = dataCache.get<Video>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Fetch from API and cache
  const video = await apiFetch<Video>(`/api/videos/${videoId}`);
  dataCache.set(cacheKey, video);
  return video;
}

/**
 * Invalidate videos cache (call after adding/deleting videos)
 */
export function invalidateVideosCache(): void {
  dataCache.invalidate(CACHE_KEYS.USER_VIDEOS);
  dataCache.invalidatePattern('video:');
  dataCache.invalidatePattern('comments:');
}
