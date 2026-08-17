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

const REFRESH_TOKEN_KEY = 'kw_refresh_token';

function persistRefreshToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

// Cross-tab logout broadcast
let authChannel: BroadcastChannel | null = null;
function getAuthChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!authChannel) {
    try {
      authChannel = new BroadcastChannel('auth');
      authChannel.onmessage = (e) => {
        if (e.data === 'logout') {
          window.location.href = '/login';
        }
      };
    } catch {}
  }
  return authChannel;
}

function broadcastLogout() {
  getAuthChannel()?.postMessage('logout');
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
      persistRefreshToken(action.payload.tokens.refreshToken);
      if (action.payload.mfaEnabled !== undefined) {
        state.mfaEnabled = action.payload.mfaEnabled;
      }
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      persistRefreshToken(action.payload.refreshToken);
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
      persistRefreshToken(null);
      broadcastLogout();
    },
  },
});

export const { setCredentials, setTokens, setUser, setMfaEnabled, setRateLimitError, logout } = authSlice.actions;
export default authSlice.reducer;
