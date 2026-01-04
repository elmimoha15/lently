import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface YouTubeSectionProps {
  userName: string;
  userAvatar: string;
}

export function YouTubeSection({ userName, userAvatar }: YouTubeSectionProps) {
  return (
    <>
      <div className="p-4 rounded-lg bg-muted/50 border border-border flex items-center gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={userAvatar} />
          <AvatarFallback>{userName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{userName}'s Channel</p>
          <p className="text-sm text-muted-foreground">125K subscribers • Connected 2 months ago</p>
        </div>
        <Badge variant="default" className="bg-green-500/20 text-green-400">Connected</Badge>
      </div>
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Permissions</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✓ Read channel information</p>
          <p>✓ Access video data</p>
          <p>✓ Read comments</p>
          <p>✓ Reply to comments</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline">Reconnect</Button>
        <Button variant="outline" className="text-destructive border-destructive/30">Disconnect</Button>
      </div>
    </>
  );
}
