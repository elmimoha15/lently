import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Zap, TrendingDown, AlertTriangle, Star, Check, Trash2, MessageSquare, Loader2, RefreshCw, TrendingUp, Frown } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead, useDeleteAlert } from '@/lib/query/alertQueries';
import { useNavigate } from 'react-router-dom';

type AlertFilter = 'all' | 'unread' | 'comment_spike' | 'sentiment_drop' | 'toxic_detected' | 'viral_comment';

export default function Alerts() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AlertFilter>('all');
  
  const { data, isLoading, error, refetch } = useAlerts(
    filter === 'unread' ? { unreadOnly: true } : 
    filter !== 'all' ? { alertType: filter } : undefined
  );
  
  const markReadMutation = useMarkAlertRead();
  const markAllReadMutation = useMarkAllAlertsRead();
  const deleteMutation = useDeleteAlert();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'comment_spike': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'sentiment_drop': return <Frown className="w-5 h-5 text-orange-500" />;
      case 'toxic_detected': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'viral_comment': return <Star className="w-5 h-5 text-primary" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const alerts = data?.alerts || [];
  const unreadCount = data?.unreadCount || 0;
  const total = data?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
            <p className="text-muted-foreground">
              {isLoading ? 'Loading...' : `${unreadCount} unread • ${total} total`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'comment_spike', label: 'Comment Spikes' },
            { key: 'sentiment_drop', label: 'Sentiment Drops' },
            { key: 'toxic_detected', label: 'Toxic Comments' },
            { key: 'viral_comment', label: 'Viral Comments' },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key as AlertFilter)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Alerts</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        )}

        {/* Alerts List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.alertId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`transition-all duration-300 ${!alert.isRead ? 'border-primary/50 bg-primary/5' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-card border border-border shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{alert.title}</h3>
                              <Badge className={getSeverityColor(alert.severity)} variant="outline">
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!alert.isRead && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(alert.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {alert.videoId && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/dashboard/videos/${alert.videoId}`)}
                            >
                              View Video
                            </Button>
                          )}
                          {!alert.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markReadMutation.mutate(alert.alertId)}
                              disabled={markReadMutation.isPending}
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteMutation.mutate(alert.alertId)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && alerts.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              {filter === 'unread' ? 'All caught up! 🎉' : 'No alerts yet'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'unread' 
                ? 'No new alerts at the moment.' 
                : 'Alerts will appear here when important events occur.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
