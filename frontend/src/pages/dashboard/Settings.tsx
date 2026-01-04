import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/stores/useStore';
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '@/lib/query/profileQueries';
import { UserProfile } from '@/lib/api/profile';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { YouTubeSection } from '@/components/settings/YouTubeSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { settingsTabs, SettingsTab } from '@/components/settings/settingsTabs';

export default function Settings() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'youtube' | 'notifications'>('profile');
  
  // Queries
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  
  // Type-safe profile access
  const userProfile = profile as UserProfile | undefined;

  const handleUpdateProfile = (data: { name?: string; timezone?: string }) => {
    updateProfileMutation.mutate(data);
  };

  const handleUploadAvatar = (file: File) => {
    uploadAvatarMutation.mutate(file);
  };

  const handleDeleteAvatar = () => {
    if (confirm('Are you sure you want to delete your avatar?')) {
      deleteAvatarMutation.mutate();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 shrink-0">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Manage your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ProfileSection
                      profile={userProfile}
                      isLoading={profileLoading}
                      onUpdateProfile={handleUpdateProfile}
                      onUploadAvatar={handleUploadAvatar}
                      onDeleteAvatar={handleDeleteAvatar}
                      uploadingAvatar={uploadAvatarMutation.isPending}
                      deletingAvatar={deleteAvatarMutation.isPending}
                      updatingProfile={updateProfileMutation.isPending}
                    />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'youtube' && (
                <Card>
                  <CardHeader>
                    <CardTitle>YouTube Connection</CardTitle>
                    <CardDescription>Manage your connected YouTube account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <YouTubeSection userName={user.name} userAvatar={user.avatar} />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose how you want to be notified</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <NotificationsSection />
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
