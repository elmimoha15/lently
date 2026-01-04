import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { updateUserPlan } from '@/lib/api/users';

type PlanType = 'free' | 'starter' | 'pro' | 'business';

interface Plan {
  id: PlanType;
  name: string;
  price: number;
  period: string;
  popular?: boolean;
  features: string[];
  videosPerMonth: number;
  aiQuestionsPerMonth: number;
  extraFeatures?: string[];
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    videosPerMonth: 1,
    aiQuestionsPerMonth: 3,
    features: [
      '1 video/month',
      '3 AI questions/month',
      'Basic sentiment analysis',
      'Comment categories',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 12,
    period: 'month',
    videosPerMonth: 50,
    aiQuestionsPerMonth: 100,
    features: [
      '50 videos/month (testing)',
      '100 AI questions/month',
      'Advanced sentiment analysis',
      'Question extraction',
      'Email alerts',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 27,
    period: 'month',
    popular: true,
    videosPerMonth: 100,
    aiQuestionsPerMonth: 500,
    features: [
      '100 videos/month (testing)',
      '500 AI questions/month',
      'All analytics features',
      'Priority AI responses',
      'Auto-sync comments',
      'Export to CSV',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 58,
    period: 'month',
    videosPerMonth: 999,
    aiQuestionsPerMonth: 9999,
    features: [
      '999 videos/month (unlimited)',
      '9999 AI questions/month',
      'Everything in Pro',
      'Analytics dashboard',
      'Team collaboration',
      'Priority support',
    ],
  },
];

export default function ChoosePlan() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const handleSelectPlan = async (planId: PlanType) => {
    setSelectedPlan(planId);
    setUpdatingPlan(true);
    
    try {
      console.log(`🔵 Updating plan to: ${planId}`);
      
      // Update plan in backend
      const updatedProfile = await updateUserPlan(planId);
      
      console.log(`✅ Plan updated successfully:`, updatedProfile);
      
      toast.success(`${planId.charAt(0).toUpperCase() + planId.slice(1)} plan activated! 🎉`, {
        description: planId !== 'free' 
          ? `You now have access to ${plans.find(p => p.id === planId)?.videosPerMonth} videos per month`
          : 'You can analyze 1 video per month'
      });
      
      // Navigate to next step after a short delay
      setTimeout(() => {
        handleContinue();
      }, 1500);
      
    } catch (error: any) {
      console.error(`❌ Error updating plan:`, error);
      toast.error('Failed to update plan', {
        description: error.message || 'Please try again'
      });
      setUpdatingPlan(false);
    }
  };

  const handleContinue = () => {
    setIsLoading(true);
    // Navigate to next step - First Video
    navigate('/onboarding/first-video');
  };

  const handleSkip = async () => {
    setUpdatingPlan(true);
    try {
      // Make sure they have free plan
      await updateUserPlan('free');
      toast.info('Continuing with Free plan');
      navigate('/onboarding/first-video');
    } catch (error) {
      console.error('Error setting free plan:', error);
      // Continue anyway
      navigate('/onboarding/first-video');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Logo className="justify-center mb-6" />
          
          {/* Progress Indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground mb-6">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              1
            </span>
            Step 1 of 3: Choose Your Plan
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose the Perfect Plan for You
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade anytime. All plans include core features.
          </p>
        </motion.div>

        {/* Plan Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card
                variant="glass"
                className={`relative h-full transition-all duration-300 ${
                  selectedPlan === plan.id
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'border-border/50 hover:border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features List */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  <Button
                    variant={plan.id === 'free' ? 'hero' : 'outline'}
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading || updatingPlan}
                  >
                    {updatingPlan && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : selectedPlan === plan.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Selected
                      </>
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center space-y-4"
        >
          <Button
            variant="link"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleSkip}
            disabled={updatingPlan}
          >
            Skip - I'll decide later
          </Button>
          
          {updatingPlan && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating your plan...
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
