import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { OrderStatus } from '@/lib/types';

interface StatusPillProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md';
}

export default function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const colors = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={cn('rounded-full', colors.dot, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {label}
    </span>
  );
}
