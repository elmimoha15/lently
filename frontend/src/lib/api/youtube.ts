import { apiFetch } from './client';

/**
 * YouTube OAuth and channel management
 */

export interface AuthUrlResponse {
  authUrl: string;
}

export interface YouTubeChannel {
  channelId: string;
  channelName: string;
  channelHandle: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
}

export interface ChannelsResponse {
  channels: YouTubeChannel[];
}

/**
 * Get YouTube OAuth authorization URL
 */
export async function getYouTubeAuthUrl(): Promise<string> {
  const response = await apiFetch<AuthUrlResponse>('/api/youtube/auth-url');
  return response.authUrl;
}

/**
 * Exchange OAuth code for tokens (called from redirect callback)
 */
export async function exchangeYouTubeCode(code: string, state: string): Promise<void> {
  await apiFetch('/api/youtube/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
}

/**
 * Get user's YouTube channels
 */
export async function getYouTubeChannels(): Promise<YouTubeChannel[]> {
  const response = await apiFetch<ChannelsResponse>('/api/youtube/channels');
  return response.channels;
}

/**
 * Disconnect YouTube account
 */
export async function disconnectYouTube(): Promise<void> {
  await apiFetch('/api/youtube/disconnect', {
    method: 'POST',
  });
}
