import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Video, Bell, MessageSquare, HelpCircle, 
  FileText, Settings, Menu, X, Plus, Search, ChevronDown, CreditCard
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlanBadge } from '@/components/PlanBadge';
import { useStore } from '@/stores/useStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { getUserVideos } from '@/lib/api/videos';
import { getTemplates } from '@/lib/api/templates';
import { getProfile } from '@/lib/api/profile';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Video, label: 'Videos', href: '/dashboard/videos' },
  { icon: MessageSquare, label: 'Ask AI', href: '/dashboard/ask-ai' },
  { icon: Bell, label: 'Alerts', href: '/dashboard/alerts', badge: 3 },
  { icon: FileText, label: 'Templates', href: '/dashboard/templates' },
  { icon: CreditCard, label: 'Billing', href: '/dashboard/billing' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, sidebarOpen, toggleSidebar, alerts } = useStore();
  const { profile } = useUserProfile();
  const unreadAlerts = alerts.filter((a) => !a.isRead).length;
  const queryClient = useQueryClient();
  
  // Use real profile data if available, otherwise fallback to store
  const displayName = profile?.displayName || user.name;
  const userEmail = profile?.email || user.email;

  // Prefetch data on hover for instant navigation
  const prefetchVideos = () => {
    queryClient.prefetchQuery({
      queryKey: ['videos'],
      queryFn: getUserVideos,
      staleTime: 30 * 1000, // Consider fresh for 30 seconds
    });
  };

  const prefetchTemplates = () => {
    queryClient.prefetchQuery({
      queryKey: ['templates'],
      queryFn: async () => {
        const response = await getTemplates();
        return response.replies;
      },
      staleTime: 30 * 1000,
    });
  };

  const prefetchProfile = () => {
    queryClient.prefetchQuery({
      queryKey: ['profile'],
      queryFn: getProfile,
      staleTime: 30 * 1000,
    });
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar - Fixed */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="flex-shrink-0 p-4 border-b border-sidebar-border flex items-center justify-between">
            <Logo />
            <button onClick={toggleSidebar} className="lg:hidden text-sidebar-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items - Scrollable if needed */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const badgeCount = item.label === 'Alerts' ? unreadAlerts : item.badge;
              
              // Prefetch data on hover for instant navigation
              const handleMouseEnter = () => {
                if (item.label === 'Videos') prefetchVideos();
                if (item.label === 'Templates') prefetchTemplates();
                if (item.label === 'Settings') prefetchProfile();
              };
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onMouseEnter={handleMouseEnter}
                  className={cn(
                    "sidebar-item",
                    isActive && "sidebar-item-active"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount && badgeCount > 0 && (
                    <Badge variant="default" className="text-xs px-1.5 py-0.5">{badgeCount}</Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Card - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
                <PlanBadge className="text-xs" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Nav - Fixed */}
        <header className="flex-shrink-0 h-16 border-b border-border bg-background flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="hero" size="sm" asChild>
              <Link to="/dashboard/videos">
                <Plus className="w-4 h-4 mr-1" />
                New Video
              </Link>
            </Button>
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
