import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: {
    id: string;
    name?: string;
    fullName?: string;
    email: string;
    phone: string;
    role: 'super_admin' | 'manager' | 'viewer';
    avatar?: string;
  } | null;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days?: number) {
  if (typeof document === 'undefined') return;
  const expires = days != null ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function getStoredToken(key: 'accessToken' | 'refreshToken'): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

const initialState: AuthState = {
  accessToken: getStoredToken('accessToken'),
  refreshToken: getStoredToken('refreshToken'),
  isAuthenticated: typeof window !== 'undefined' ? !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')) : false,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null') : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthState['user']; tokens: { accessToken: string; refreshToken: string }; rememberMe?: boolean }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        const storage = action.payload.rememberMe !== false ? localStorage : sessionStorage;
        storage.setItem('accessToken', action.payload.tokens.accessToken);
        storage.setItem('refreshToken', action.payload.tokens.refreshToken);
        storage.setItem('user', JSON.stringify(action.payload.user));
        setCookie('accessToken', action.payload.tokens.accessToken, action.payload.rememberMe !== false ? 7 : undefined);
        setCookie('refreshToken', action.payload.tokens.refreshToken, action.payload.rememberMe !== false ? 7 : undefined);
      }
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      if (typeof window !== 'undefined') {
        const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage;
        storage.setItem('accessToken', action.payload.accessToken);
        storage.setItem('refreshToken', action.payload.refreshToken);
        setCookie('accessToken', action.payload.accessToken);
        setCookie('refreshToken', action.payload.refreshToken);
      }
    },
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        removeCookie('accessToken');
        removeCookie('refreshToken');
      }
    },
  },
});

export const { setCredentials, setTokens, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
