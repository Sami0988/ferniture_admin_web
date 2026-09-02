import type { ProformaStatus } from '@/types/api';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ProformaStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ProformaStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sent' },
  accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Accepted' },
  expired: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Expired' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span
        className={cn(
          'rounded-full',
          config.bg.replace('100', '400'),
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
        )}
      />
      {config.label}
    </span>
  );
}
