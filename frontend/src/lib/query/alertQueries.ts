import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
  type AlertFilters,
} from '@/lib/api/alerts';
import { dataCache } from '@/lib/cache/dataCache';
import { toast } from 'sonner';

const alertsQueryKey = ['alerts'];

/**
 * Get alerts with React Query
 */
export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: [...alertsQueryKey, filters],
    queryFn: () => getAlerts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
}

/**
 * Mark alert as read mutation
 */
export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => markAlertRead(alertId),
    onSuccess: () => {
      // Invalidate alerts cache
      queryClient.invalidateQueries({ queryKey: alertsQueryKey });
      dataCache.invalidate('alerts:all');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark alert as read');
    },
  });
}

/**
 * Mark all alerts as read mutation
 */
export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllAlertsRead(),
    onSuccess: () => {
      // Invalidate alerts cache
      queryClient.invalidateQueries({ queryKey: alertsQueryKey });
      dataCache.invalidate('alerts:all');
      toast.success('All alerts marked as read');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark alerts as read');
    },
  });
}

/**
 * Delete alert mutation
 */
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => deleteAlert(alertId),
    onSuccess: () => {
      // Invalidate alerts cache
      queryClient.invalidateQueries({ queryKey: alertsQueryKey });
      dataCache.invalidate('alerts:all');
      toast.success('Alert deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete alert');
    },
  });
}
