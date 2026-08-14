'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTokens, setCredentials, logout } from '@/store/authSlice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';
const LOG_KEY = '__tokenRefreshDebug';

function debugLog(msg: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    existing.push({ time: new Date().toISOString(), msg });
    localStorage.setItem(LOG_KEY, JSON.stringify(existing.slice(-20)));
  } catch {}
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const hasAttemptedRefresh = useRef(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    localStorage.removeItem(LOG_KEY);
    debugLog('Provider mounted');
    debugLog('Redux refreshToken: ' + refreshToken);
    debugLog('Redux isAuthenticated: ' + isAuthenticated);
    debugLog('Cookie refreshToken: ' + getCookie('refreshToken'));
    debugLog('All cookies: ' + document.cookie);

    if (hasAttemptedRefresh.current) {
      debugLog('Already attempted refresh, skipping');
      setIsRestoring(false);
      return;
    }
    if (isAuthenticated) {
      debugLog('Already authenticated, skipping');
      setIsRestoring(false);
      return;
    }

    const token = refreshToken || getCookie('refreshToken');
    debugLog('Using token: ' + token);

    if (!token) {
      debugLog('No token found, skipping restore');
      hasAttemptedRefresh.current = true;
      setIsRestoring(false);
      return;
    }

    hasAttemptedRefresh.current = true;

    (async () => {
      try {
        debugLog('Sending POST /auth/refresh with refreshToken: ' + token);
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token }),
        });

        debugLog('Response status: ' + res.status);
        const data = await res.json();
        debugLog('Response body: ' + JSON.stringify(data).substring(0, 500));

        if (res.ok) {
          const tokens = data.data?.tokens || data.data;
          debugLog('Parsed tokens: ' + JSON.stringify(tokens));

          if (tokens?.accessToken && tokens?.refreshToken) {
            dispatch(setTokens({
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            }));
            debugLog('setTokens dispatched, fetching /users/me');

            const userRes = await fetch(`${BASE_URL}/users/me`, {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            });

            debugLog('/users/me status: ' + userRes.status);

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
              debugLog('Session restored successfully!');
            } else {
              debugLog('/users/me FAILED');
            }
          } else {
            debugLog('Tokens shape invalid!');
          }
        } else {
          debugLog('Refresh FAILED - calling logout');
          dispatch(logout());
        }
      } catch (err: any) {
        debugLog('Network error: ' + err.message);
        dispatch(logout());
      } finally {
        setIsRestoring(false);
      }
    })();
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
