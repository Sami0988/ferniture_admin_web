const PRODUCTION_API_URL = 'https://kassahun-backend.onrender.com/api/v1';
const LOCAL_API_URL = 'http://localhost:3000/api/v1';

/**
 * Base URL of the backend API.
 * Set NEXT_PUBLIC_API_URL to choose it explicitly. Without it, only a
 * production build talks to the live backend; local development falls back to
 * a local backend so a missing .env can never read or write real data.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : LOCAL_API_URL);
