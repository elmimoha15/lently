import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface PlanBadgeProps {
  className?: string;
}

export function PlanBadge({ className }: PlanBadgeProps) {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="w-3 h-3 animate-spin" />
      </Badge>
    );
  }

  if (!profile) {
    return null;
  }

  const planName = profile.plan.toUpperCase();
  const variant = profile.plan === 'free' ? 'outline' : 'pro';

  return (
    <Badge variant={variant} className={className}>
      {planName}
    </Badge>
  );
}
