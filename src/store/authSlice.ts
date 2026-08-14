import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RateLimitInfo {
  message: string;
  retryAfter: number;
  endpoint: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  mfaEnabled: boolean;
  rateLimitError: RateLimitInfo | null;
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

function setCookie(name: string, value: string, days?: number) {
  if (typeof document === 'undefined') return;
  const expires = days != null ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function setLocal(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}
function removeLocal(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  mfaEnabled: false,
  rateLimitError: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthState['user']; tokens: { accessToken: string; refreshToken: string }; mfaEnabled?: boolean }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isAuthenticated = true;
      if (action.payload.mfaEnabled !== undefined) {
        state.mfaEnabled = action.payload.mfaEnabled;
      }
      if (typeof document !== 'undefined') {
        setCookie('accessToken', action.payload.tokens.accessToken, 7);
        setCookie('refreshToken', action.payload.tokens.refreshToken, 7);
        setLocal('refreshToken', action.payload.tokens.refreshToken);
        setLocal('accessToken', action.payload.tokens.accessToken);
      }
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      if (typeof document !== 'undefined') {
        setCookie('accessToken', action.payload.accessToken, 7);
        setCookie('refreshToken', action.payload.refreshToken, 7);
        setLocal('refreshToken', action.payload.refreshToken);
        setLocal('accessToken', action.payload.accessToken);
      }
    },
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
    },
    setMfaEnabled: (state, action: PayloadAction<boolean>) => {
      state.mfaEnabled = action.payload;
    },
    setRateLimitError: (state, action: PayloadAction<RateLimitInfo | null>) => {
      state.rateLimitError = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.mfaEnabled = false;
      state.rateLimitError = null;
      if (typeof document !== 'undefined') {
        removeCookie('accessToken');
        removeCookie('refreshToken');
        removeLocal('accessToken');
        removeLocal('refreshToken');
        removeLocal('__tokenRefreshDebug');
      }
    },
  },
});

export const { setCredentials, setTokens, setUser, setMfaEnabled, setRateLimitError, logout } = authSlice.actions;
export default authSlice.reducer;
