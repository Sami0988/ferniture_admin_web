import { cn } from '@/lib/utils';
import { ProjectDivision } from '@/types/api';

interface DivisionBadgeProps {
  division: ProjectDivision;
  size?: 'sm' | 'md';
}

export default function DivisionBadge({ division, size = 'sm' }: DivisionBadgeProps) {
  const config: Record<ProjectDivision, { label: string; className: string }> = {
    furniture: {
      label: 'FURNITURE',
      className: 'bg-walnut/10 text-walnut border-walnut/20',
    },
    aluminum: {
      label: 'ALUMINUM',
      className: 'bg-aluminum/10 text-aluminum border-aluminum/20',
    },
    interior_design: {
      label: 'DESIGN',
      className: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    },
    custom_orders: {
      label: 'CUSTOM',
      className: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    accessories: {
      label: 'ACCESSORIES',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  };

  const { label, className } = config[division] ?? { label: division.toUpperCase(), className: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-mono font-semibold tracking-wider',
        className,
        size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'
      )}
    >
      {label}
    </span>
  );
}
