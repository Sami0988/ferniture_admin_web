'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Moon, Sun, PanelLeftClose, PanelLeft, LogOut, ChevronDown, Calendar } from 'lucide-react';
import { useUI, useAuth } from '@/hooks/useStore';
import { useGetUnreadCountQuery } from '@/store/api/notificationsApi';
import { useLogoutMutation } from '@/store/api/authApi';
import { cancelRefresh } from '@/store/refreshAuth';
import Avatar from '@/components/ui/Avatar';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import GlobalSearch from '@/components/layout/GlobalSearch';

export default function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode, calendar, toggleCalendar } = useUI();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.data?.count ?? 0;
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [logoutApi] = useLogoutMutation();

  // Close panels on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    if (showNotifications || showProfile) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications, showProfile]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    cancelRefresh();
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignore errors — clear local state anyway
    }
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-surface-hover transition-colors shrink-0"
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <PanelLeft className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>

      {/* Search */}
      <div className="w-96">
        <button
          onClick={() => setShowSearch(true)}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface-hover/50 px-3 text-sm text-muted hover:border-muted transition-colors"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search suppliers, customers, projects...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted font-medium">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: Calendar | Dark mode | Notifications | Profile */}
      <div className="flex items-center gap-1">
        {/* Calendar toggle */}
        <button
          onClick={toggleCalendar}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title={calendar === 'ec' ? 'Switch to Gregorian Calendar' : 'Switch to Ethiopian Calendar'}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{calendar === 'ec' ? 'EC' : 'GC'}</span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-border" />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface-hover transition-colors"
          >
            <Avatar name={user?.fullName || user?.name || 'Admin'} size="sm" />
            <div className="hidden sm:flex flex-col items-start max-w-[120px]">
              <span suppressHydrationWarning className="text-xs font-medium text-foreground leading-tight line-clamp-2">{user?.fullName || user?.name}</span>
              <span suppressHydrationWarning className="text-[10px] text-muted capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted hidden sm:block" />
          </button>

          {/* Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface shadow-2xl z-50 py-1">
              <div className="px-3 py-2 border-b border-border">
                <p suppressHydrationWarning className="text-sm font-medium text-foreground">{user?.fullName || user?.name}</p>
                <p suppressHydrationWarning className="text-xs text-muted">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <GlobalSearch open={showSearch} onClose={() => setShowSearch(false)} />
    </header>
  );
}
