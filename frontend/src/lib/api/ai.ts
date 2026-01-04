import { api } from './client';

export interface AskAIRequest {
  videoId: string;
  question: string;
  conversationId?: string;
}

export interface AskAIResponse {
  answer: string;
  confidence: number;
  relatedCommentIds: string[];
  conversationId: string;
  remainingQuestions: number;
  cached: boolean;
}

export interface SuggestedQuestion {
  question: string;
  category: string;
}

export interface SuggestedQuestionsResponse {
  suggestions: SuggestedQuestion[];
}

/**
 * Ask AI a question about video comments
 */
export async function askAI(data: AskAIRequest): Promise<AskAIResponse> {
  const response = await api.post<AskAIResponse>('/api/ai/chat', data);
  return response.data;
}

/**
 * Get suggested questions for a video
 */
export async function getSuggestedQuestions(videoId: string): Promise<SuggestedQuestionsResponse> {
  const response = await api.get<SuggestedQuestionsResponse>(`/api/ai/suggestions?video_id=${videoId}`);
  return response.data;
}
