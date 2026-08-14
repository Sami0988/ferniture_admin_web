const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function getLocal(name: string): string | null {
  try { return localStorage.getItem(name); } catch { return null; }
}

export function getToken(name: string): string | null {
  return getCookie(name) || getLocal(name);
}

export async function refreshAuth(): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getToken('refreshToken');
  if (!refreshToken) return null;

  refreshPromise = (async () => {
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
          return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
        }
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
