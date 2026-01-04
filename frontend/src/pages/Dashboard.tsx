import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, MessageSquare, HelpCircle, AlertTriangle, RefreshCw, Plus, ArrowRight, Eye, ThumbsUp, Loader2, Video } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboard } from '@/hooks/useDashboard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const sentimentData = [
  { date: 'Dec 14', score: 35 },
  { date: 'Dec 15', score: 42 },
  { date: 'Dec 16', score: 38 },
  { date: 'Dec 17', score: 45 },
  { date: 'Dec 18', score: 52 },
  { date: 'Dec 19', score: 48 },
  { date: 'Dec 20', score: 55 },
  { date: 'Dec 21', score: 50 },
];

const categoryData = [
  { name: 'Praise', value: 46, color: 'hsl(142, 76%, 36%)' },
  { name: 'Questions', value: 19, color: 'hsl(217, 91%, 60%)' },
  { name: 'Suggestions', value: 18, color: 'hsl(280, 67%, 60%)' },
  { name: 'Complaints', value: 10, color: 'hsl(0, 84%, 60%)' },
  { name: 'Spam', value: 7, color: 'hsl(0, 0%, 50%)' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    totalVideos, 
    totalComments, 
    avgSentiment, 
    flaggedComments, 
    recentVideos,
    profile,
    loading,
    error,
    refresh 
  } = useDashboard();
  
  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Failed to Load Dashboard</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refresh}>Try Again</Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  const displayName = profile?.displayName || 'there';
  const firstName = displayName.split(' ')[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {firstName}! 👋</h1>
            <p className="text-muted-foreground">
              {totalVideos === 0 
                ? 'No videos analyzed yet' 
                : `${totalVideos} video${totalVideos === 1 ? '' : 's'} analyzed • ${totalComments.toLocaleString()} total comments`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/dashboard/videos/add">
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: 'Total Comments', 
              value: totalComments.toLocaleString(), 
              trend: totalVideos > 0 ? `${totalVideos} videos` : 'No data', 
              positive: true, 
              icon: MessageSquare 
            },
            { 
              label: 'Avg Sentiment', 
              value: avgSentiment > 0 ? `+${Math.round(avgSentiment)}` : '—', 
              trend: avgSentiment > 0 ? 'Positive' : 'No data', 
              positive: avgSentiment > 0, 
              icon: avgSentiment > 0 ? TrendingUp : TrendingDown 
            },
            { 
              label: 'Videos Analyzed', 
              value: totalVideos, 
              subtitle: profile?.plan ? `${profile.plan} plan` : '', 
              icon: Eye 
            },
            { 
              label: 'Flagged', 
              value: flaggedComments, 
              warning: flaggedComments > 0, 
              icon: AlertTriangle 
            },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card variant="metric">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${metric.warning ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      <metric.icon className="w-5 h-5" />
                    </div>
                    {metric.trend && (
                      <Badge variant={metric.positive ? 'success' : 'destructive'}>
                        {metric.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {metric.trend}
                      </Badge>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  {metric.subtitle && <p className="text-xs text-primary mt-1">{metric.subtitle}</p>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sentiment Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sentiment Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentData}>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Categories Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comment Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </div>
                      <span className="text-foreground font-medium">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Videos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Videos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/videos">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentVideos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No videos analyzed yet</p>
                <Button variant="hero" asChild>
                  <Link to="/dashboard/videos/add">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Video
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentVideos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-card-hover transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/videos/${video.id}`)}
                  >
                    <img src={video.thumbnailUrl} alt={video.title} className="w-24 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{video.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {(video.viewCount / 1000).toFixed(1)}K
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {video.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {video.commentCount}
                        </span>
                      </div>
                    </div>
                    <Badge variant={video.avgSentiment > 0.5 ? 'positive' : video.avgSentiment > 0 ? 'neutral' : 'negative'}>
                      {video.avgSentiment > 0 ? '+' : ''}{Math.round(video.avgSentiment * 100)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
