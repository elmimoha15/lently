import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getJobStatus } from '@/lib/api/videos';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface Step {
  id: number;
  label: string;
  status: 'pending' | 'inProgress' | 'completed';
  progress?: string;
}

export default function Analyzing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('queued');
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: 'Connected to YouTube', status: 'pending' },
    { id: 2, label: 'Fetched video metadata', status: 'pending' },
    { id: 3, label: 'Downloading comments', status: 'pending' },
    { id: 4, label: 'AI analyzing sentiment', status: 'pending' },
    { id: 5, label: 'Categorizing comments', status: 'pending' },
    { id: 6, label: 'Extracting questions', status: 'pending' },
  ]);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Redirect if no jobId
  useEffect(() => {
    if (!jobId) {
      toast.error('No job ID provided');
      navigate('/dashboard/videos/add');
    }
  }, [jobId, navigate]);

  // Poll job status
  useEffect(() => {
    if (!jobId) return;

    let pollInterval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        console.log('🔵 Polling job status:', jobId);
        const jobStatus = await getJobStatus(jobId);
        console.log('✅ Job status:', jobStatus);

        // Update progress
        setProgress(jobStatus.progress);
        setStatus(jobStatus.status);
        setVideoId(jobStatus.videoId);

        // Update steps based on progress
        updateSteps(jobStatus.progress, jobStatus.processedComments, jobStatus.totalComments);

        // Handle completion
        if (jobStatus.status === 'completed') {
          clearInterval(pollInterval);
          
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

          toast.success('Analysis complete!');
          
          // Redirect to video details page after 2 seconds
          setTimeout(() => {
            if (jobStatus.videoId) {
              navigate(`/dashboard/videos/${jobStatus.videoId}`);
            } else {
              navigate('/dashboard/videos');
            }
          }, 2500);
        }

        // Handle failure
        if (jobStatus.status === 'failed') {
          clearInterval(pollInterval);
          toast.error(jobStatus.error || 'Analysis failed');
          setTimeout(() => {
            navigate('/dashboard/videos/add');
          }, 3000);
        }
      } catch (error: any) {
        console.error('❌ Error polling job status:', error);
        
        // If 404, the job might not be created yet or was deleted
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.log('⏳ Job not found yet, will retry...');
          // Don't clear interval, keep trying
          return;
        }
        
        // For other errors, stop polling
        clearInterval(pollInterval);
        toast.error('Failed to get analysis status');
      }
    };

    // Poll immediately, then every 3 seconds
    pollStatus();
    pollInterval = setInterval(pollStatus, 3000);

    return () => clearInterval(pollInterval);
  }, [jobId, navigate]);

  const updateSteps = (progress: number, processed: number, total: number) => {
    const newSteps = [...steps];

    if (progress >= 5) {
      newSteps[0].status = 'completed'; // Connected to YouTube
    }
    if (progress >= 10) {
      newSteps[1].status = 'completed'; // Fetched metadata
    }
    if (progress >= 15 && progress < 70) {
      newSteps[2].status = 'inProgress'; // Downloading comments
      if (processed > 0 && total > 0) {
        newSteps[2].progress = `${processed}/${total}`;
      }
    }
    if (progress >= 70) {
      newSteps[2].status = 'completed';
      newSteps[2].progress = `${total}/${total}`;
    }
    if (progress >= 75 && progress < 85) {
      newSteps[3].status = 'inProgress'; // AI analyzing
    }
    if (progress >= 85) {
      newSteps[3].status = 'completed';
    }
    if (progress >= 85 && progress < 95) {
      newSteps[4].status = 'inProgress'; // Categorizing
    }
    if (progress >= 95) {
      newSteps[4].status = 'completed';
    }
    if (progress >= 95 && progress < 100) {
      newSteps[5].status = 'inProgress'; // Questions
    }
    if (progress >= 100) {
      newSteps[5].status = 'completed';
    }

    setSteps(newSteps);
  };

  const getStepIcon = (step: Step) => {
    if (step.status === 'completed') {
      return (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      );
    }
    if (step.status === 'inProgress') {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground/30" />;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg relative z-10 text-center"
        >
          {/* Progress */}
          <div className="mb-8">
            <div className="text-6xl font-bold text-foreground mb-4">
              {status === 'completed' ? 'Complete! ✓' : `Analyzing... ${progress}%`}
            </div>
            <div className="h-2 bg-card rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/70"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {getStepIcon(step)}
                <span className={
                  step.status === 'completed' ? 'text-muted-foreground line-through' : 
                  step.status === 'inProgress' ? 'text-foreground font-medium' : 
                  'text-muted-foreground/50'
                }>
                  {step.label} {step.progress && <span className="text-primary">({step.progress})</span>}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            {status === 'completed' ? 'Redirecting to video details...' : "You can close this page—we'll email you when ready"}
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
