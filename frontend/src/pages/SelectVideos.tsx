import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Grid3X3, Zap, Star, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SelectVideos() {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');

  const handleQuickAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) {
      toast.error('Please enter a video URL');
      return;
    }
    toast.success('Starting quick analysis...');
    navigate('/analyzing');
  };

  const handleFullSync = () => {
    toast.success('Starting full channel sync...');
    navigate('/analyzing');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
      >
        {/* Step Indicator */}
        <div className="text-center mb-8">
          <Logo className="justify-center mb-4" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              2
            </span>
            Step 2 of 2: Choose Videos
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Analysis */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card variant="feature" className="h-full">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="w-16 h-16 rounded-2xl bg-card-hover border border-border flex items-center justify-center mb-6">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Analyze a Single Video
                </h2>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Paste a YouTube video URL to get instant insights on that video's comments.
                </p>

                <form onSubmit={handleQuickAnalysis} className="space-y-4">
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="h-12"
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="success">
                      <Zap className="w-3 h-3 mr-1" />
                      FREE
                    </Badge>
                    <span className="text-xs text-muted-foreground">Results in ~2 minutes</span>
                  </div>
                  <Button type="submit" variant="outline" className="w-full">
                    Analyze Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Full Channel Sync */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card variant="highlighted" className="h-full relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge variant="default">
                  <Star className="w-3 h-3 mr-1" />
                  RECOMMENDED
                </Badge>
              </div>
              <CardContent className="p-8 flex flex-col h-full">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
                  <Grid3X3 className="w-8 h-8 text-primary" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Sync Your Entire Channel
                </h2>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Analyze all your videos and unlock the full power of Tubex insights.
                </p>

                <div className="bg-background-secondary rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Videos found:</span>
                    <span className="text-foreground font-medium">47 videos</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. comments:</span>
                    <span className="text-foreground font-medium">~12,340 comments</span>
                  </div>
                </div>

                <Button variant="hero" className="w-full" onClick={handleFullSync}>
                  Start Full Sync
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
