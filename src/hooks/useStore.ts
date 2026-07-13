'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar, toggleDarkMode, setActiveView } from '@/store/uiSlice';
import { logout as authLogout, setCredentials, setUser } from '@/store/authSlice';

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
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  return {
    user,
    isAuthenticated,
    accessToken,
    setCredentials: (payload: { user: typeof user; tokens: { accessToken: string; refreshToken: string }; rememberMe?: boolean }) =>
      dispatch(setCredentials(payload)),
    setUser: (userData: typeof user) => dispatch(setUser(userData)),
    logout: () => dispatch(authLogout()),
  };
};
