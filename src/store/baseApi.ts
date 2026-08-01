import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';
import { logout } from './authSlice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Single-flight refresh: only one /refresh call at a time
let refreshPromise: Promise<{ data?: unknown; error?: unknown }> | null = null;

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
}

const baseQueryWithReauth = async (
  args: string | { url: string; method?: string; body?: unknown; headers?: Record<string, string> },
  api: Parameters<typeof baseQuery>[1],
  extraOptions: Parameters<typeof baseQuery>[2]
) => {
  const result = await baseQuery(args, api, extraOptions);

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
    // Check if this is an account locked error
    const errorData = result.error.data as { errorCode?: string; message?: string } | undefined;
    if (errorData?.errorCode === 'ACCOUNT_LOCKED') {
      // Don't attempt refresh for locked accounts
      api.dispatch(logout());
      redirectToLogin();
      return result;
    }

    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (!refreshToken) {
      api.dispatch(logout());
      redirectToLogin();
      return result;
    }

    // Single-flight: reuse existing refresh promise if one is in-flight
    if (!refreshPromise) {
      refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Refresh failed');
          }
          const data = await res.json();
          return { data: data.data?.tokens || data.data };
        })
        .catch((err) => {
          return { error: err };
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const refreshResult = await refreshPromise;

    if (refreshResult.data) {
      const tokens = refreshResult.data as { accessToken: string; refreshToken: string };
      api.dispatch({ type: 'auth/setTokens', payload: tokens });

      // Retry the original request with new token
      return baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — clear auth and redirect
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
  ],
  endpoints: () => ({}),
});
