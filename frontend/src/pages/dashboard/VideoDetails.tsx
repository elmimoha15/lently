import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { getVideoDetails } from '@/lib/api/videos';
import { getVideoComments } from '@/lib/api/comments';
import type { Video } from '@/lib/api/videos';
import type { Comment } from '@/lib/api/comments';
import { toast } from 'sonner';
import { VideoHeader, VideoCard, CategoryCard, CommentsSection, AskAISection } from '@/components/video-details';

export default function VideoDetails() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch video details and comments in parallel
        const [videoData, commentsData] = await Promise.all([
          getVideoDetails(videoId),
          getVideoComments(videoId, { limit: 100 }),
        ]);

        setVideo(videoData);
        setComments(commentsData.comments);
      } catch (err: any) {
        console.error('Failed to fetch video details:', err);
        setError(err.message || 'Failed to load video details');
        toast.error('Failed to load video details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading video details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !video) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Failed to Load Video</h2>
              <p className="text-muted-foreground mb-4">{error || 'Video not found'}</p>
              <Button onClick={() => navigate('/dashboard/videos')}>Back to Videos</Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <VideoHeader onBack={() => navigate('/dashboard/videos')} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Info + Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Card */}
            <VideoCard video={video} />
            
            {/* Comments Section */}
            <CommentsSection comments={comments} />
          </div>

          {/* Right Column - Ask AI + Categories */}
          <div className="space-y-6">
            {/* Ask AI Section - Moved to top */}
            <AskAISection videoId={videoId!} comments={comments} />
            
            {/* Comment Categories */}
            <CategoryCard comments={comments} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
