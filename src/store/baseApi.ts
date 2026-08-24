import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';
import { logout, getStoredRefreshToken } from './authSlice';
import { refreshAuth } from './refreshAuth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

function getCalendarValue(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('kw_calendar') || '';
  } catch { return ''; }
}

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Single-flight refresh handled by shared refreshAuth module

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
}

const baseQueryWithReauth = async (
  args: string | { url: string; method?: string; body?: unknown; headers?: Record<string, string>; params?: Record<string, string> },
  api: Parameters<typeof baseQuery>[1],
  extraOptions: Parameters<typeof baseQuery>[2]
) => {
  // Inject calendar param when user preference is set
  const cal = getCalendarValue();
  let modifiedArgs = args;
  if (typeof args !== 'string' && (cal === 'ec' || cal === 'ec-fiscal')) {
    modifiedArgs = {
      ...args,
      params: { ...args.params, calendar: cal },
    };
  }

  const result = await baseQuery(modifiedArgs, api, extraOptions);

  // Handle 429 Rate Limit
  if (result.error && result.error.status === 429) {
    const errorData = result.error.data as { message?: string; retryAfter?: number } | undefined;
    const retryAfter = errorData?.retryAfter || 60;
    const message = errorData?.message || 'Too many attempts. Please try again later.';

    // Dispatch a global error that components can listen to
    api.dispatch({
      type: 'auth/setRateLimitError',
      payload: { message, retryAfter, endpoint: typeof args === 'string' ? args : args.url },
    });

    return result;
  }

  // Handle 401 Unauthorized
  if (result.error && result.error.status === 401) {
    // Don't attempt refresh if this IS the refresh request
    const requestUrl = typeof args === 'string' ? args : args.url;
    if (requestUrl.includes('/auth/refresh')) {
      api.dispatch(logout());
      redirectToLogin();
      return result;
    }

    // Check if this is an account locked error
    const errorData = result.error.data as { errorCode?: string; message?: string } | undefined;
    if (errorData?.errorCode === 'ACCOUNT_LOCKED') {
      api.dispatch(logout());
      redirectToLogin();
      return result;
    }

    const refreshToken = (api.getState() as RootState).auth.refreshToken || getStoredRefreshToken();
    const tokens = await refreshAuth(refreshToken);

    if (tokens) {
      api.dispatch({ type: 'auth/setTokens', payload: tokens });
      return baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
      redirectToLogin();
    }
  }

  return result;
};

const baseQueryWithRetry = retry(baseQueryWithReauth, { maxRetries: 1 });

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    'User',
    'Employee',
    'Customer',
    'Project',
    'Material',
    'MaterialSelection',
    'Invoice',
    'Payment',
    'Notification',
    'Product',
    'Gallery',
    'Testimonial',
    'Contact',
    'Quote',
    'Faq',
    'CompanySetting',
    'AuditLog',
    'DashboardReport',
    'PaymentLetter',
    'LetterTemplate',
    'Supplier',
    'Purchase',
    'Calendar',
  ],
  endpoints: () => ({}),
});
