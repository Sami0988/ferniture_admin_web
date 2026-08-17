const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;
let refreshCancelled = false;

export async function refreshAuth(): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (refreshCancelled) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      if (refreshCancelled) return null;

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshCancelled) return null;

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

export function cancelRefresh(): void {
  refreshCancelled = true;
  refreshPromise = null;
}

export function resetRefreshState(): void {
  refreshCancelled = false;
}
