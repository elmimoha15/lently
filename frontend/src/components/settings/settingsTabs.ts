import { User, Youtube, Bell } from 'lucide-react';

export interface SettingsTab {
  id: 'profile' | 'youtube' | 'notifications';
  label: string;
  icon: typeof User;
}

export const settingsTabs: SettingsTab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'youtube', label: 'YouTube Connection', icon: Youtube },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];
