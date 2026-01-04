import { Eye, ThumbsUp, MessageSquare, Calendar, ExternalLink, Download, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Video } from '@/lib/api/videos';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          {/* Thumbnail */}
          <div className="relative w-full md:w-64 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary/80 hover:bg-primary"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
            >
              <Play className="w-7 h-7 text-white fill-white" />
            </Button>
          </div>

          {/* Video Info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <h2 className="text-lg font-bold text-foreground mb-1 line-clamp-2">{video.title}</h2>
            <p className="text-sm text-muted-foreground mb-3">{video.channelTitle}</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium text-foreground">
                  {video.viewCount.toLocaleString()}
                </span>
                <span className="text-xs">views</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm font-medium text-foreground">
                  {video.likeCount.toLocaleString()}
                </span>
                <span className="text-xs">likes</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium text-foreground">
                  {video.commentCount.toLocaleString()}
                </span>
                <span className="text-xs">comments</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium text-foreground">
                  {new Date(video.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open on YouTube
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
