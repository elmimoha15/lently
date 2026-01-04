/**
 * Profile Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  deleteAvatar,
  ProfileUpdateRequest 
} from '@/lib/api/profile';

/**
 * Get user profile
 */
export const useProfile = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    // Show cached data instantly
    initialData: () => {
      return queryClient.getQueryData(['profile']);
    },
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to update profile';
      toast.error(message);
    },
  });
};

/**
 * Upload avatar
 */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (data) => {
      // Update profile query data with new avatar URL
      queryClient.setQueryData(['profile'], (old: any) => ({
        ...old,
        avatarUrl: data.avatarUrl,
      }));
      toast.success('Avatar uploaded successfully');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to upload avatar';
      toast.error(message);
    },
  });
};

/**
 * Delete avatar
 */
export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAvatar,
    onSuccess: () => {
      // Update profile query data to remove avatar URL
      queryClient.setQueryData(['profile'], (old: any) => ({
        ...old,
        avatarUrl: null,
      }));
      toast.success('Avatar deleted successfully');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to delete avatar';
      toast.error(message);
    },
  });
};
