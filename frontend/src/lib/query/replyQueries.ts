/**
 * TanStack Query hooks for reply posting
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { postReply, getReplies, getReplyStatus, PostReplyRequest } from '../api/replies';

/**
 * Post a reply to a comment
 */
export const usePostReply = (commentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PostReplyRequest) => postReply(commentId, data),
    onSuccess: (data) => {
      // Invalidate replies query to refresh list
      queryClient.invalidateQueries({ queryKey: ['replies', commentId] });
      
      const message = data.status === 'queued' 
        ? 'Reply queued for posting to YouTube'
        : 'Reply saved as draft';
      
      toast.success(message);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to post reply';
      toast.error(message);
    },
  });
};

/**
 * Get all replies for a comment
 */
export const useReplies = (commentId: string, enabled = true) => {
  return useQuery({
    queryKey: ['replies', commentId],
    queryFn: () => getReplies(commentId),
    enabled,
  });
};

/**
 * Get status of a specific reply (for polling)
 */
export const useReplyStatus = (replyId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['reply', replyId],
    queryFn: () => getReplyStatus(replyId!),
    enabled: enabled && !!replyId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if status is queued or posting
      const data = query.state.data;
      if (data?.status === 'queued' || data?.status === 'posting') {
        return 2000;
      }
      return false; // Stop polling when posted or failed
    },
  });
};
