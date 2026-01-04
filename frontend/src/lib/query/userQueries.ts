import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserPlan, type UserProfile } from '@/lib/api/users';
import { queryKeys } from './config';
import { dataCache, CACHE_KEYS } from '@/lib/cache/dataCache';
import { toast } from 'sonner';

/**
 * Get user profile with React Query
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: () => getUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user plan mutation
 */
export function useUpdateUserPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: 'free' | 'starter' | 'pro' | 'business') => updateUserPlan(plan),
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(queryKeys.userProfile, data);
      dataCache.set(CACHE_KEYS.USER_PROFILE, data);
      toast.success('Plan updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update plan');
    },
  });
}
