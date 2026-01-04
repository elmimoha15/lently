import { motion } from 'framer-motion';
import { Sparkle, MessageSquare, Lightbulb, TrendingUp, AlertCircle, BarChart3, Target, Search, Loader2, Video } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Video {
  id: string;
  title: string;
  thumbnail?: string;
}

interface WelcomeStateProps {
  creatorName: string;
  question: string;
  loading: boolean;
  videos: Video[];
  selectedVideo: string;
  onQuestionChange: (value: string) => void;
  onVideoChange: (videoId: string) => void;
  onSuggestedClick: (question: string) => void;
  onSubmit: () => void;
}

export function WelcomeState({
  creatorName,
  question,
  loading,
  videos,
  selectedVideo,
  onQuestionChange,
  onVideoChange,
  onSuggestedClick,
  onSubmit,
}: WelcomeStateProps) {
  const suggestedQuestions = [
    { icon: <MessageSquare className="w-5 h-5" />, title: "What are people complaining about?" },
    { icon: <Lightbulb className="w-5 h-5" />, title: "What content ideas are viewers suggesting?" },
    { icon: <TrendingUp className="w-5 h-5" />, title: "What topics get the most engagement?" },
    { icon: <AlertCircle className="w-5 h-5" />, title: "Are there any negative trends?" },
    { icon: <BarChart3 className="w-5 h-5" />, title: "What questions are asked most?" },
    { icon: <Target className="w-5 h-5" />, title: "What do viewers like most?" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center py-12"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <Sparkle className="w-8 h-8 text-red-500" />
        </div>
      </motion.div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-foreground mb-3">
          Good {getGreeting()}, {creatorName}
        </h1>
        <p className="text-muted-foreground text-lg">
          Hey there! What can I do for your campaigns today?
        </p>
      </motion.div>

      {/* Suggested Questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-12"
      >
        {suggestedQuestions.map((item, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onClick={() => onSuggestedClick(item.title)}
            className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-card hover:bg-card/80 border border-border hover:border-red-500/30 hover:shadow-md hover:shadow-red-500/5 transition-all duration-300"
          >
            <span className="text-muted-foreground group-hover:text-red-500 transition-colors">
              {item.icon}
            </span>
            <span className="text-sm font-medium text-foreground group-hover:text-red-500 transition-colors">
              {item.title}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-3xl mx-auto space-y-4"
      >
        {/* Video Selector */}
        <div className="flex items-center gap-3">
          <Label htmlFor="video-select" className="text-sm font-medium text-foreground whitespace-nowrap">
            Ask about:
          </Label>
          <Select value={selectedVideo} onValueChange={onVideoChange}>
            <SelectTrigger id="video-select" className="w-full bg-card border-border hover:border-red-500/30 focus:border-red-500/50 transition-colors">
              <SelectValue placeholder="Select a video" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span>All Videos (Across channel)</span>
                </div>
              </SelectItem>
              {videos.map((video) => (
                <SelectItem key={video.id} value={video.id}>
                  <div className="flex items-center gap-2">
                    {video.thumbnail ? (
                      <img 
                        src={video.thumbnail} 
                        alt="" 
                        className="w-12 h-7 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-7 rounded bg-muted flex items-center justify-center">
                        <Video className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="truncate max-w-[400px]">{video.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question Input */}
        <div className="relative flex items-center">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <Textarea
            placeholder="Write a message here..."
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            className="w-full pl-12 pr-16 py-4 rounded-2xl resize-none min-h-[64px] max-h-[120px] bg-card border-border hover:border-red-500/30 focus:border-red-500/50 transition-colors text-base leading-relaxed"
            style={{ textAlign: 'left' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          <Button
            onClick={onSubmit}
            disabled={!question.trim() || loading}
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
