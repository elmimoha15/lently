import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Youtube, Check, Shield, Lock, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const permissions = [
  'View your channel statistics',
  'Access your video comments',
  'Read video metadata',
  'View your subscriber list (count only)',
];

const trustBadges = [
  { icon: Shield, text: 'OAuth 2.0 Secure' },
  { icon: Lock, text: 'Read-only Access' },
];

export default function ConnectYouTube() {
  const navigate = useNavigate();

  // Auto-redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/select-videos');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSkip = () => {
    navigate('/select-videos');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Step Indicator */}
        <div className="text-center mb-8">
          <Logo className="justify-center mb-4" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              1
            </span>
            Step 1 of 2: Connect YouTube
          </div>
        </div>

        <Card variant="glass" className="border-border/50">
          <CardContent className="pt-8 pb-6 px-8 text-center">
            {/* YouTube Logo */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <div className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Youtube className="w-12 h-12 text-primary" />
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold text-foreground mb-2">
              YouTube Connection Coming Soon!
            </h1>
            <p className="text-muted-foreground mb-8">
              For now, you can analyze any public video by URL. We'll add channel connection later!
            </p>

            {/* Info Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-sm font-medium text-foreground mb-2">✨ What you can do now:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Analyze any public YouTube video</li>
                <li>• Get instant comment insights</li>
                <li>• AI-powered analysis</li>
                <li>• No channel connection needed</li>
              </ul>
            </div>

            {/* Skip Button */}
            <Button
              variant="hero"
              size="xl"
              className="w-full mb-4"
              onClick={handleSkip}
            >
              Continue to Video Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {/* Auto-redirect notice */}
            <p className="text-xs text-muted-foreground">
              Redirecting automatically in 3 seconds...
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
