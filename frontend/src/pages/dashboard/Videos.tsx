import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Loader2, AlertTriangle, Video as VideoIcon, Play, Eye, MessageSquare, Trash2, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVideos } from '@/hooks/useVideos';

export default function Videos() {
  const navigate = useNavigate();
  const { videos, loading, error, refresh } = useVideos();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSentimentEmoji = (score: number) => {
    if (score >= 50) return '😊';
    if (score >= 20) return '🙂';
    if (score >= 0) return '😐';
    if (score >= -20) return '😕';
    return '😢';
  };

  const getSentimentColor = (score: number) => {
    if (score >= 20) return 'text-green-500';
    if (score >= 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)}mo ago`;
    return `${Math.ceil(diffDays / 365)}y ago`;
  };

  const handleDelete = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this video analysis?')) {
      // TODO: Implement delete API call
      console.log('Delete video:', videoId);
    }
  };

  const handleViewVideo = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://youtube.com/watch?v=${videoId}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Videos</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${videos.length} video${videos.length === 1 ? '' : 's'} analyzed`}
            </p>
          </div>
          <Button variant="hero" onClick={() => navigate('/dashboard/videos/add')}>
            <Play className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading your videos...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Failed to Load Videos</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refresh}>Try Again</Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <VideoIcon className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">No Videos Yet</h2>
                <p className="text-muted-foreground mb-4">
                  Start by analyzing your first YouTube video
                </p>
                <Button variant="hero" onClick={() => navigate('/dashboard/videos/add')}>
                  <Play className="w-4 h-4 mr-2" />
                  Add Your First Video
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Videos List */}
        {!loading && !error && videos.length > 0 && (
          <>
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* No Search Results */}
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No videos match your search.</p>
              </div>
            ) : (
              /* Video Table */
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[500px]">Video</TableHead>
                      <TableHead className="text-center w-[100px]">Views</TableHead>
                      <TableHead className="text-center w-[100px]">Comments</TableHead>
                      <TableHead className="text-center w-[100px]">Published</TableHead>
                      <TableHead className="text-center w-[120px]">Sentiment</TableHead>
                      <TableHead className="text-right w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVideos.map((video, index) => (
                      <TableRow
                        key={video.id}
                        className="cursor-pointer group"
                        onClick={() => navigate(`/dashboard/videos/${video.id}`)}
                      >
                        {/* Video with Thumbnail */}
                        <TableCell className="font-medium">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center gap-3"
                          >
                            <div className="relative w-24 h-14 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground line-clamp-2 leading-tight">
                                {video.title}
                              </p>
                            </div>
                          </motion.div>
                        </TableCell>

                        {/* Views */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span className="font-medium">{formatNumber(video.viewCount)}</span>
                          </div>
                        </TableCell>

                        {/* Comments */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-medium">{formatNumber(video.commentCount)}</span>
                          </div>
                        </TableCell>

                        {/* Published Date */}
                        <TableCell className="text-center">
                          <span className="text-muted-foreground text-sm">
                            {formatDate(video.publishedAt)}
                          </span>
                        </TableCell>

                        {/* Sentiment */}
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={`${getSentimentColor(video.avgSentiment * 100)} border-current`}
                          >
                            {getSentimentEmoji(video.avgSentiment * 100)} {video.avgSentiment > 0 ? '+' : ''}{Math.round(video.avgSentiment * 100)}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/videos/${video.id}`);
                              }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleViewVideo(video.id, e)}
                              title="Open on YouTube"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDelete(video.id, e)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
