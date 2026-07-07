import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  accent?: 'walnut' | 'aluminum' | 'gold' | 'default';
}

export default function KpiCard({ title, value, icon, change, changeType = 'neutral', accent = 'default' }: KpiCardProps) {
  const accentStyles = {
    walnut: 'border-l-walnut',
    aluminum: 'border-l-aluminum',
    gold: 'border-l-brand-gold',
    default: 'border-l-gray-300',
  };

  return (
    <div className={cn('rounded-xl border border-border bg-surface p-4 border-l-4', accentStyles[accent])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn('text-xs font-medium', {
              'text-green-600': changeType === 'positive',
              'text-red-600': changeType === 'negative',
              'text-muted': changeType === 'neutral',
            })}>
              {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-surface-hover p-2 text-muted">
          {icon}
        </div>
      </div>
    </div>
  );
}
