/**
 * Profile API functions
 */

import { api, apiFetch } from './client';

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  timezone?: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
  message: string;
}

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('/api/users/profile');
  return response.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (data: ProfileUpdateRequest): Promise<UserProfile> => {
  const response = await api.put<UserProfile>('/api/users/profile', data);
  return response.data;
};

/**
 * Upload avatar image
 */
export const uploadAvatar = async (file: File): Promise<AvatarUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Use apiFetch directly for FormData (don't stringify)
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/avatar`, {
    method: 'POST',
    headers: {
      // Don't set Content-Type for FormData - browser will set it with boundary
      'Authorization': document.cookie.includes('token') 
        ? `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        : '',
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail);
  }
  
  return response.json();
};

/**
 * Delete avatar
 */
export const deleteAvatar = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>('/api/users/avatar');
  return response.data;
};
