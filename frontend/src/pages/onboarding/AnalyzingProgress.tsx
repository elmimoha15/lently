import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Circle, Mail, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done';
  progress?: string;
}

const funFacts = [
  "YouTube processes over 500 hours of video every minute",
  "The average comment length is 47 characters",
  "Questions get 3x more replies than other comments",
  "Positive comments boost video recommendations",
  "The first 24 hours get 60% of total comments",
  "Emoji usage increased by 300% in the last 3 years",
  "Videos with timestamps get 2x more engagement",
  "The most common comment time is between 6-9 PM",
];

export default function AnalyzingProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const videoUrl = location.state?.videoUrl || 'https://youtube.com/watch?v=example';

  const [progress, setProgress] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: 'metadata', label: 'Fetched video metadata', status: 'pending' },
    { id: 'youtube', label: 'Connected to YouTube', status: 'pending' },
    { id: 'comments', label: 'Downloading comments', status: 'pending', progress: '0/0' },
    { id: 'sentiment', label: 'AI analyzing sentiment', status: 'pending' },
    { id: 'categorize', label: 'Categorizing comments', status: 'pending' },
    { id: 'questions', label: 'Extracting questions', status: 'pending' },
  ]);

  // Rotate fun facts every 10 seconds
  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 10000);

    return () => clearInterval(factInterval);
  }, []);

  // Simulate analysis progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2; // Increase by 2% every interval
      });
    }, 200); // Update every 200ms (total ~10 seconds to reach 100%)

    return () => clearInterval(progressInterval);
  }, []);

  // Update steps based on progress
  useEffect(() => {
    const newSteps = [...steps];

    if (progress >= 10) {
      newSteps[0].status = 'done'; // Metadata
    }
    if (progress >= 20) {
      newSteps[1].status = 'done'; // YouTube
    }
    if (progress >= 30 && progress < 70) {
      newSteps[2].status = 'loading'; // Comments
      // Simulate comment download progress
      const totalComments = 1234;
      const currentComments = Math.floor((progress - 30) / 40 * totalComments);
      newSteps[2].progress = `${currentComments}/${totalComments}`;
    }
    if (progress >= 70) {
      newSteps[2].status = 'done';
      newSteps[2].progress = '1234/1234';
    }
    if (progress >= 75 && progress < 85) {
      newSteps[3].status = 'loading'; // Sentiment
    }
    if (progress >= 85) {
      newSteps[3].status = 'done';
    }
    if (progress >= 85 && progress < 95) {
      newSteps[4].status = 'loading'; // Categorize
    }
    if (progress >= 95) {
      newSteps[4].status = 'done';
    }
    if (progress >= 95 && progress < 100) {
      newSteps[5].status = 'loading'; // Questions
    }
    if (progress >= 100) {
      newSteps[5].status = 'done';
    }

    setSteps(newSteps);
  }, [progress]);

  // Handle completion
  useEffect(() => {
    if (progress >= 100) {
      // Trigger confetti
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#EF4444', '#F97316', '#F59E0B'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#EF4444', '#F97316', '#F59E0B'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    }
  }, [progress, navigate]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
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
              3
            </span>
            Step 3 of 3: Analysis in Progress
          </div>

          {/* Main Progress */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold text-foreground mb-2">
              {progress < 100 ? `${progress}%` : (
                <span className="flex items-center justify-center gap-2">
                  Analysis Complete!
                  <Sparkles className="w-8 h-8 text-primary" />
                </span>
              )}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {progress < 100 ? 'Analyzing your video...' : 'Redirecting to your insights...'}
            </p>
          </motion.div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-3 mb-8" />
        </div>

        <Card variant="glass" className="border-border/50 mb-6">
          <CardContent className="pt-6 pb-6">
            {/* Analysis Steps */}
            <div className="space-y-4 mb-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm ${
                      step.status === 'done' ? 'text-foreground line-through' : 
                      step.status === 'loading' ? 'text-primary font-medium' : 
                      'text-muted-foreground'
                    }`}>
                      {step.label}
                      {step.progress && step.status === 'loading' && (
                        <span className="ml-2 text-primary">({step.progress})</span>
                      )}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Fun Facts Section */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                💡 Did you know?
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentFactIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-sm text-foreground"
                >
                  {funFacts[currentFactIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Email Notification */}
        {progress < 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              We'll email you when ready (but stick around - almost done!)
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
