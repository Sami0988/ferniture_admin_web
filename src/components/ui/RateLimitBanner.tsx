'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useStore';

interface RateLimitBannerProps {
  endpoint?: string;
  className?: string;
}

export default function RateLimitBanner({ endpoint, className = '' }: RateLimitBannerProps) {
  const { rateLimitError } = useAuth();
  const [countdown, setCountdown] = useState(0);

  const isVisible = rateLimitError && (!endpoint || rateLimitError.endpoint.includes(endpoint));

  useEffect(() => {
    if (!isVisible || !rateLimitError) {
      setCountdown(0);
      return;
    }

    setCountdown(rateLimitError.retryAfter);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, rateLimitError]);

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className={`rounded-lg bg-amber-50 border border-amber-200 p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-700">
          <p>{rateLimitError.message}</p>
          {countdown > 0 && (
            <p className="text-xs mt-1 text-amber-600">
              Try again in {formatTime(countdown)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
