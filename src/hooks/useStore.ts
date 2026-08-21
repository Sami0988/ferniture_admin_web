'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar, toggleDarkMode, toggleCalendar, setActiveView } from '@/store/uiSlice';
import type { CalendarType } from '@/store/uiSlice';
import { logout as authLogout, setCredentials, setUser, setMfaEnabled } from '@/store/authSlice';

// UI hooks
export const useUI = () => {
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const activeView = useAppSelector((s) => s.ui.activeView);
  const darkMode = useAppSelector((s) => s.ui.darkMode);
  const calendar = useAppSelector((s) => s.ui.calendar);

  return {
    sidebarCollapsed,
    activeView,
    darkMode,
    calendar,
    toggleSidebar: () => dispatch(toggleSidebar()),
    toggleDarkMode: () => dispatch(toggleDarkMode()),
    toggleCalendar: () => dispatch(toggleCalendar()),
    setActiveView: (view: 'list' | 'kanban') => dispatch(setActiveView(view)),
  };
};

// Auth hooks
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const mfaEnabled = useAppSelector((s) => s.auth.mfaEnabled);
  const rateLimitError = useAppSelector((s) => s.auth.rateLimitError);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);

  return {
    user,
    isAuthenticated,
    mfaEnabled,
    rateLimitError,
    refreshToken,
    hasRole: (roles: string | string[]) => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    setCredentials: (payload: { user: typeof user; tokens: { accessToken: string; refreshToken: string }; rememberMe?: boolean; mfaEnabled?: boolean }) =>
      dispatch(setCredentials(payload)),
    setUser: (userData: typeof user) => dispatch(setUser(userData)),
    setMfaEnabled: (enabled: boolean) => dispatch(setMfaEnabled(enabled)),
    logout: () => dispatch(authLogout()),
  };
};
