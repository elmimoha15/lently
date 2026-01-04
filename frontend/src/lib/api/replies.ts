/**
 * API functions for posting replies to comments
 */

import { api } from './client';

export interface PostReplyRequest {
  replyText: string;
  postToYouTube: boolean;
  templateId?: string;
}

export interface ReplyResponse {
  replyId: string;
  status: string;
  message: string;
  youtubeCommentId?: string;
  error?: string;
}

export interface Reply {
  replyId: string;
  userId: string;
  videoId: string;
  commentId: string;
  replyText: string;
  templateId?: string;
  status: 'queued' | 'posting' | 'posted' | 'failed' | 'draft';
  youtubeCommentId?: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
  postedAt?: string;
}

/**
 * Post a reply to a comment
 */
export const postReply = async (
  commentId: string,
  data: PostReplyRequest
): Promise<ReplyResponse> => {
  const response = await api.post<ReplyResponse>(`/api/comments/${commentId}/reply`, data);
  return response.data;
};

/**
 * Get all replies for a comment
 */
export const getReplies = async (commentId: string): Promise<Reply[]> => {
  const response = await api.get<Reply[]>(`/api/comments/${commentId}/replies`);
  return response.data;
};

/**
 * Get status of a specific reply
 */
export const getReplyStatus = async (replyId: string): Promise<Reply> => {
  const response = await api.get<Reply>(`/api/comments/reply/${replyId}`);
  return response.data;
};
