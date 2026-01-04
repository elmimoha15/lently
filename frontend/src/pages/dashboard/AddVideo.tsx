import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Youtube, ArrowRight, Lightbulb, AlertCircle, Link as LinkIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/DashboardLayout';
import { validateVideoUrl, analyzeVideo } from '@/lib/api/videos';

export default function AddVideo() {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [urlError, setUrlError] = useState('');

  const validateYouTubeUrl = (url: string): boolean => {
    // YouTube URL patterns
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    ];

    // Check if it's a playlist or channel
    if (url.includes('list=') || url.includes('/playlist')) {
      setUrlError('Playlist URLs are not supported. Please use a single video URL.');
      return false;
    }
    if (url.includes('/channel/') || url.includes('/c/') || url.includes('/@')) {
      setUrlError('Channel URLs are not supported. Please use a video URL.');
      return false;
    }

    const isValid = patterns.some(pattern => pattern.test(url));
    if (!isValid) {
      setUrlError('Please enter a valid YouTube video URL');
    }
    return isValid;
  };

  const handleAnalyze = async () => {
    // Reset error
    setUrlError('');

    if (!videoUrl.trim()) {
      setUrlError('Please enter a YouTube video URL');
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      return;
    }

    try {
      setIsValidating(true);
      
      // Step 1: Validate the URL and get video metadata
      console.log('🔵 Validating video URL...');
      const videoData = await validateVideoUrl(videoUrl);
      console.log('✅ Video validated:', videoData.title);
      
      toast.success(`Video found: ${videoData.title}`);
      setIsValidating(false);
      setIsAnalyzing(true);

      // Step 2: Start analysis
      console.log('🔵 Starting video analysis...');
      const { jobId, videoId } = await analyzeVideo(videoUrl);
      console.log('✅ Analysis started:', { jobId, videoId });
      
      toast.success('Analysis started!');
      
      // Navigate to analyzing page with jobId
      navigate(`/analyzing?jobId=${jobId}`);
      
    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      
      if (error.message.includes('403') || error.message.includes('limit')) {
        // Plan limit reached
        toast.error('You\'ve reached your plan limit. Please upgrade to analyze more videos.');
        setUrlError('Plan limit reached. Upgrade to continue.');
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        setUrlError('Video not found or comments are disabled');
      } else if (error.message.includes('Invalid')) {
        setUrlError(error.message);
      } else {
        toast.error('Failed to analyze video. Please try again.');
        setUrlError('Something went wrong. Please try again.');
      }
      
      setIsValidating(false);
      setIsAnalyzing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setVideoUrl(text);
      setUrlError('');
    } catch (error) {
      toast.error('Failed to paste from clipboard');
    }
  };

  const popularExamples = [
    {
      title: 'Tech Tutorial',
      url: 'https://youtube.com/watch?v=jNQXAC9IVRw',
      icon: Video,
    },
    {
      title: 'Product Review',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      icon: Video,
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background py-12 px-4">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Youtube className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Analyze a YouTube Video
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Paste any YouTube video URL to get instant AI-powered comment insights
            </p>
          </div>

          {/* Main Card */}
          <Card variant="glass" className="border-border/50 mb-8">
            <CardHeader className="pb-4">
              <h2 className="text-xl font-semibold text-foreground">Enter Video URL</h2>
              <p className="text-sm text-muted-foreground">
                We'll analyze all comments and provide insights about sentiment, questions, and more
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* URL Input */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setUrlError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    className={`pl-12 pr-24 h-14 text-base bg-background-secondary border-border ${
                      urlError ? 'border-red-500 focus-visible:ring-red-500' : ''
                    }`}
                    disabled={isValidating || isAnalyzing}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10"
                    onClick={handlePaste}
                    disabled={isValidating || isAnalyzing}
                  >
                    Paste
                  </Button>
                </div>

                {/* Error Message */}
                {urlError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-500">{urlError}</p>
                  </motion.div>
                )}

                {/* Pro Tip */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">💡 Pro tip:</p>
                    <p className="text-muted-foreground">
                      Videos with more comments provide better insights. Choose videos with at least 50+ comments for best results.
                    </p>
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleAnalyze}
                disabled={isValidating || isAnalyzing || !videoUrl.trim()}
              >
                {isValidating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Validating URL...
                  </>
                ) : isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    Analyze Video
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* What Happens Next */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  What happens next:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Fetch video data</p>
                      <p className="text-xs text-muted-foreground">We'll grab the video title, views, and metadata</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Download comments</p>
                      <p className="text-xs text-muted-foreground">All public comments will be downloaded</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">AI analysis</p>
                      <p className="text-xs text-muted-foreground">Sentiment, categories, questions, and insights</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">View results</p>
                      <p className="text-xs text-muted-foreground">Explore insights and ask AI questions</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Videos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Don't have a video URL? Try one of these:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {popularExamples.map((example) => (
                <button
                  key={example.url}
                  onClick={() => {
                    setVideoUrl(example.url);
                    setUrlError('');
                  }}
                  className="px-4 py-2 rounded-lg bg-background-secondary hover:bg-background-secondary/80 border border-border hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                >
                  <example.icon className="w-4 h-4" />
                  {example.title}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
