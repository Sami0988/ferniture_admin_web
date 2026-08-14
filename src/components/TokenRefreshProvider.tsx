'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCredentials, logout } from '@/store/authSlice';
import { refreshAuth, getToken } from '@/store/refreshAuth';

export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setIsRestoring(false);
      return;
    }

    const token = getToken('refreshToken');
    if (!token) {
      setIsRestoring(false);
      return;
    }

    refreshAuth().then((tokens) => {
      if (tokens) {
        const fetchUser = async () => {
          try {
            const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';
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
          } catch {
            // ignore
          }
        };
        fetchUser();
      }
      setIsRestoring(false);
    });
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
