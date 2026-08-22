'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCredentials } from '@/store/authSlice';
import { getStoredAccessToken, getStoredRefreshToken, getStoredUser } from '@/store/authSlice';
import { refreshAuth, resetRefreshState } from '@/store/refreshAuth';

export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [isRestoring, setIsRestoring] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setIsRestoring(false);
      resetRefreshState();
      return;
    }

    let cancelled = false;

    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

    const restoreSession = async () => {
      const storedAccessToken = getStoredAccessToken();
      const storedUser = getStoredUser();
      const storedRefreshToken = getStoredRefreshToken();

      if (storedAccessToken && storedUser) {
        dispatch(setCredentials({
          user: storedUser,
          tokens: { accessToken: storedAccessToken, refreshToken: storedRefreshToken || '' },
        }));
        if (!cancelled && mountedRef.current) setIsRestoring(false);
        return;
      }

      if (!storedRefreshToken) {
        if (!cancelled && mountedRef.current) setIsRestoring(false);
        return;
      }

      const tokens = await refreshAuth(storedRefreshToken);
      if (cancelled || !mountedRef.current) return;

      if (tokens) {
        try {
          const userRes = await fetch(`${BASE_URL}/users/me`, {
            credentials: 'include',
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
        } catch {
          // ignore
        }
      }
      if (!cancelled && mountedRef.current) {
        setIsRestoring(false);
      }
    };

    restoreSession();

    return () => { cancelled = true; };
  }, [isAuthenticated, dispatch]);

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
