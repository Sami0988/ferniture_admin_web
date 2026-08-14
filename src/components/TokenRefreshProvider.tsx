'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTokens, setCredentials, logout } from '@/store/authSlice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

// Module-level flag: only ONE refresh attempt across all instances
let hasRefreshed = false;
let refreshPromise: Promise<void> | null = null;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function getLocal(name: string): string | null {
  try { return localStorage.getItem(name); } catch { return null; }
}

function getToken(name: string): string | null {
  return getCookie(name) || getLocal(name);
}

/**
 * Silently refreshes the access token on page load if a refresh token exists
 * in cookie or localStorage. Uses a module-level flag to prevent multiple
 * concurrent refresh attempts (which would consume/rotate the token).
 */
export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [isRestoring, setIsRestoring] = useState(!hasRefreshed);

  useEffect(() => {
    if (hasRefreshed) {
      setIsRestoring(false);
      return;
    }
    if (isAuthenticated) {
      hasRefreshed = true;
      setIsRestoring(false);
      return;
    }

    const token = refreshToken || getToken('refreshToken');
    if (!token) {
      hasRefreshed = true;
      setIsRestoring(false);
      return;
    }

    // If a refresh is already in progress, wait for it
    if (refreshPromise) {
      refreshPromise.then(() => setIsRestoring(false));
      return;
    }

    hasRefreshed = true;

    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token }),
        });

        if (res.ok) {
          const data = await res.json();
          const tokens = data.data?.tokens || data.data;

          if (tokens?.accessToken && tokens?.refreshToken) {
            dispatch(setTokens({
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            }));

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
          dispatch(logout());
        }
      } catch {
        dispatch(logout());
      }
    })();

    refreshPromise.finally(() => {
      setIsRestoring(false);
    });
  }, [refreshToken, isAuthenticated, dispatch]);

  if (isRestoring) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ marginBottom: 12, fontSize: 14 }}>Restoring session...</div>
          <div className="animate-spin" style={{ width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#9ca3af', borderRadius: '50%', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
