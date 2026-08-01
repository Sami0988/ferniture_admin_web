'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTokens, setCredentials, logout } from '@/store/authSlice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

/**
 * Silently refreshes the access token on page load if a refresh token exists in Redux.
 * This handles hard reloads where tokens are lost from memory.
 *
 * NOTE: Once the backend sets HttpOnly cookies, this component can be removed
 * since the browser will automatically send cookies on reload.
 */
export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const hasAttemptedRefresh = useRef(false);

  useEffect(() => {
    // Only attempt refresh once, and only if we have a refresh token but no access token
    // (which happens after a hard reload when tokens are in memory only)
    if (hasAttemptedRefresh.current) return;
    if (isAuthenticated) return;

    const attemptSilentRefresh = async () => {
      if (!refreshToken) return;

      hasAttemptedRefresh.current = true;

      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (res.ok) {
          const data = await res.json();
          const tokens = data.data?.tokens || data.data;

          if (tokens?.accessToken && tokens?.refreshToken) {
            dispatch(setTokens({
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            }));

            // Fetch user profile
            const userRes = await fetch(`${BASE_URL}/users/me`, {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            });

            if (userRes.ok) {
              const userData = await userRes.json();
              const user = userData.data;

              dispatch(setCredentials({
                user: {
                  id: user.id,
                  name: user.fullName || user.name || '',
                  email: user.email || '',
                  phone: user.phone || '',
                  role: user.role || 'viewer',
                  avatar: user.avatarUrl || user.avatar || null,
                },
                tokens,
                mfaEnabled: user.mfaEnabled,
              }));
            }
          }
        } else {
          // Refresh failed — clear any stale state
          dispatch(logout());
        }
      } catch {
        // Network error — clear state, user will need to log in again
        dispatch(logout());
      }
    };

    attemptSilentRefresh();
  }, [refreshToken, isAuthenticated, dispatch]);

  return <>{children}</>;
}
