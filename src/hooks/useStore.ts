'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar, toggleDarkMode, setActiveView } from '@/store/uiSlice';
import { logout as authLogout, setCredentials, setUser, setMfaEnabled } from '@/store/authSlice';

// UI hooks
export const useUI = () => {
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const activeView = useAppSelector((s) => s.ui.activeView);
  const darkMode = useAppSelector((s) => s.ui.darkMode);

  return {
    sidebarCollapsed,
    activeView,
    darkMode,
    toggleSidebar: () => dispatch(toggleSidebar()),
    toggleDarkMode: () => dispatch(toggleDarkMode()),
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

  return {
    user,
    isAuthenticated,
    mfaEnabled,
    rateLimitError,
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
