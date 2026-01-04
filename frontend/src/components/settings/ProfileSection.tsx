import { useRef, useState } from 'react';
import { Upload, Loader2, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserProfile } from '@/lib/api/profile';
import { toast } from 'sonner';

interface ProfileSectionProps {
  profile?: UserProfile;
  isLoading: boolean;
  onUpdateProfile: (data: { name?: string; timezone?: string }) => void;
  onUploadAvatar: (file: File) => void;
  onDeleteAvatar: () => void;
  uploadingAvatar: boolean;
  deletingAvatar: boolean;
  updatingProfile: boolean;
}

export function ProfileSection({
  profile,
  isLoading,
  onUpdateProfile,
  onUploadAvatar,
  onDeleteAvatar,
  uploadingAvatar,
  deletingAvatar,
  updatingProfile,
}: ProfileSectionProps) {
  const [name, setName] = useState(profile?.name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when profile changes
  useState(() => {
    if (profile) {
      setName(profile.name);
      setTimezone(profile.timezone);
    }
  });

  const handleSaveProfile = () => {
    onUpdateProfile({
      name: name.trim() || undefined,
      timezone: timezone || undefined,
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB');
      return;
    }

    onUploadAvatar(file);
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profile?.avatarUrl} />
          <AvatarFallback className="text-2xl">
            {profile?.name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </>
            )}
          </Button>
          {profile?.avatarUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteAvatar}
              disabled={deletingAvatar}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      {/* Profile Fields */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={profile?.name}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={profile?.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Email cannot be changed
          </p>
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              <SelectItem value="Europe/London">London (GMT)</SelectItem>
              <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
              <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Save Button */}
      <Button
        variant="hero"
        onClick={handleSaveProfile}
        disabled={updatingProfile}
      >
        {updatingProfile ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </>
  );
}
