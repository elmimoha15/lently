/**
 * Templates/AI Replies API
 * API functions for managing reply templates
 */

import { api } from './client';

// Types
export interface Template {
  replyId: string;
  userId: string;
  question: string;
  replyText: string;
  timesAsked: number;
  videoIds: string[];
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface GenerateTemplateRequest {
  question: string;
  videoContext?: {
    channelName?: string;
    videoTitle?: string;
    videoId?: string;
  };
}

export interface TemplatesResponse {
  replies: Template[];
  total: number;
}

export interface CommonQuestion {
  question: string;
  count: number;
  commentIds: string[];
}

// Get all templates for current user
export async function getTemplates(): Promise<TemplatesResponse> {
  const response = await api.get<TemplatesResponse>('/api/ai-replies');
  return response.data;
}

// Generate new AI template
export async function generateTemplate(data: GenerateTemplateRequest): Promise<Template> {
  const response = await api.post<Template>('/api/ai-replies/generate', data);
  return response.data;
}

// Update template text
export async function updateTemplate(replyId: string, replyText: string): Promise<Template> {
  const response = await api.put<Template>(`/api/ai-replies/${replyId}`, { replyText });
  return response.data;
}

// Delete template
export async function deleteTemplate(replyId: string): Promise<void> {
  await api.delete<void>(`/api/ai-replies/${replyId}`);
}

// Mark template as used (increments useCount)
export async function markTemplateUsed(replyId: string): Promise<void> {
  await api.post<void>(`/api/ai-replies/${replyId}/use`);
}

// Get common questions for a video
export async function getCommonQuestions(videoId: string): Promise<CommonQuestion[]> {
  const response = await api.get<{ questions: CommonQuestion[] }>(`/api/videos/${videoId}/common-questions`);
  return response.data.questions;
}
