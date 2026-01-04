import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoHeaderProps {
  onBack: () => void;
}

export function VideoHeader({ onBack }: VideoHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Video Analysis</h1>
        <p className="text-sm text-muted-foreground">Detailed insights and comments</p>
      </div>
    </div>
  );
}
