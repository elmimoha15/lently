import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Youtube, ArrowRight, Lightbulb, Link as LinkIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function FirstVideo() {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      toast.error('Please enter a YouTube video URL');
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    toast.success('Starting analysis...');
    
    // Simulate API call
    setTimeout(() => {
      navigate('/onboarding/analyzing', { state: { videoUrl } });
    }, 500);
  };

  const handleConnectYouTube = () => {
    toast.info('YouTube OAuth integration coming soon!');
    // Navigate to YouTube connection flow (Step 1 from original onboarding)
    // navigate('/connect-youtube');
  };

  const handleSkipDemo = () => {
    toast.info('Loading demo data...');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" />
          
          {/* Progress Indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              2
            </span>
            Step 2 of 3: First Video
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">
            Let's Analyze Your First Video!
          </h1>
          <p className="text-lg text-muted-foreground">
            Paste any YouTube video URL to get instant insights
          </p>
        </div>

        <Card variant="glass" className="border-border/50">
          <CardContent className="pt-8 pb-6 px-8">
            {/* Video URL Input */}
            <div className="space-y-4 mb-8">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  className="pl-12 h-14 text-base bg-background-secondary border-border"
                  disabled={isLoading}
                />
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">💡 Pro tip:</span> Start with your most popular video to see the best insights
                </p>
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              variant="hero"
              size="xl"
              className="w-full mb-4"
              onClick={handleAnalyze}
              disabled={isLoading || !videoUrl.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Starting Analysis...
                </>
              ) : (
                <>
                  Analyze Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            {/* Connect YouTube Button */}
            <Button
              variant="outline"
              size="lg"
              className="w-full mb-4"
              onClick={handleConnectYouTube}
            >
              <Youtube className="w-5 h-5 mr-2" />
              Connect YouTube Channel
            </Button>

            {/* Skip Link */}
            <button
              onClick={handleSkipDemo}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now - Browse demo data
            </button>
          </CardContent>
        </Card>

        {/* Example URLs (Optional) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-muted-foreground mb-2">
            Don't have a video handy? Try one of these:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setVideoUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')}
              className="px-3 py-1 text-xs rounded-full bg-background-secondary hover:bg-background-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              Popular Music Video
            </button>
            <button
              onClick={() => setVideoUrl('https://youtube.com/watch?v=jNQXAC9IVRw')}
              className="px-3 py-1 text-xs rounded-full bg-background-secondary hover:bg-background-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              Tech Tutorial
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
