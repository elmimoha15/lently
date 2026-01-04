/**
 * Template Query Hooks
 * React Query hooks for template/reply management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getTemplates, 
  generateTemplate, 
  updateTemplate, 
  deleteTemplate, 
  markTemplateUsed,
  getCommonQuestions,
  GenerateTemplateRequest
} from '@/lib/api/templates';
import { toast } from 'sonner';

// Get all templates
export function useTemplates() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await getTemplates();
      return response.replies; // Return just the array
    },
    // Instantly show cached data
    initialData: () => {
      return queryClient.getQueryData(['templates']);
    },
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
  });
}

// Generate new template
export function useGenerateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: GenerateTemplateRequest) => generateTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template generated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to generate template';
      toast.error(message);
    },
  });
}

// Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ replyId, replyText }: { replyId: string; replyText: string }) => 
      updateTemplate(replyId, replyText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update template');
    },
  });
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (replyId: string) => deleteTemplate(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete template');
    },
  });
}

// Mark template as used
export function useMarkTemplateUsed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (replyId: string) => markTemplateUsed(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => {
      // Silent fail - not critical
      console.error('Failed to increment template usage');
    },
  });
}

// Get common questions for a video
export function useCommonQuestions(videoId: string) {
  return useQuery({
    queryKey: ['common-questions', videoId],
    queryFn: () => getCommonQuestions(videoId),
    enabled: !!videoId,
  });
}
