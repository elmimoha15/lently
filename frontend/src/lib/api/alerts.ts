import { apiFetch } from './client';
import { dataCache, CACHE_KEYS } from '@/lib/cache/dataCache';

export interface Alert {
  alertId: string;
  userId: string;
  videoId?: string;
  commentId?: string;
  type: string; // 'comment_spike' | 'sentiment_drop' | 'toxic_detected' | 'viral_comment' | etc
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: Record<string, any>; // Additional alert metadata
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  unreadCount: number;
}

export interface AlertFilters {
  unreadOnly?: boolean;
  alertType?: string;
  severity?: string;
  limit?: number;
}

/**
 * Get user alerts with optional filtering (with caching)
 */
export async function getAlerts(filters?: AlertFilters, skipCache = false): Promise<AlertsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.unreadOnly) params.append('unread_only', 'true');
  if (filters?.alertType) params.append('alert_type', filters.alertType);
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const queryString = params.toString();
  const url = `/api/alerts${queryString ? `?${queryString}` : ''}`;
  
  // Only cache if no filters
  const cacheKey = 'alerts:all';
  if (!skipCache && !queryString) {
    const cached = dataCache.get<AlertsResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  const response = await apiFetch<AlertsResponse>(url);
  
  // Only cache unfiltered results
  if (!queryString) {
    dataCache.set(cacheKey, response, 2 * 60 * 1000); // Cache for 2 minutes
  }
  
  return response;
}

/**
 * Mark alert as read
 */
export async function markAlertRead(alertId: string): Promise<void> {
  await apiFetch(`/api/alerts/${alertId}/read`, {
    method: 'PUT', // Changed from POST to PUT
  });
  
  // Invalidate alerts cache
  dataCache.invalidate('alerts:all');
}

/**
 * Mark all alerts as read
 */
export async function markAllAlertsRead(): Promise<void> {
  await apiFetch('/api/alerts/mark-all-read', { // Changed from /read-all to /mark-all-read
    method: 'POST',
  });
  
  // Invalidate alerts cache
  dataCache.invalidate('alerts:all');
}

/**
 * Delete alert
 */
export async function deleteAlert(alertId: string): Promise<void> {
  await apiFetch(`/api/alerts/${alertId}`, {
    method: 'DELETE',
  });
  
  // Invalidate alerts cache
  dataCache.invalidate('alerts:all');
}
