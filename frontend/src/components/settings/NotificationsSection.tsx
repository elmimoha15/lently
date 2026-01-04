import { Switch } from '@/components/ui/switch';

export function NotificationsSection() {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div>
            <p className="font-medium text-foreground">Email Notifications</p>
            <p className="text-sm text-muted-foreground">Receive updates via email</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div>
            <p className="font-medium text-foreground">Push Notifications</p>
            <p className="text-sm text-muted-foreground">Browser push notifications</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Alert Types</h4>
        {['Comment Spikes', 'Sentiment Drops', 'Toxic Comments', 'New Questions'].map((alert) => (
          <div key={alert} className="flex items-center justify-between py-2">
            <span className="text-foreground">{alert}</span>
            <Switch defaultChecked />
          </div>
        ))}
      </div>
    </>
  );
}
