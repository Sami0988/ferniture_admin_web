import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'wood' | 'aluminum' | 'gold' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
          {
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': variant === 'default',
            'bg-gray-100 text-gray-600': variant === 'secondary',
            'bg-walnut/10 text-walnut': variant === 'wood',
            'bg-aluminum/10 text-aluminum': variant === 'aluminum',
            'bg-brand-gold/10 text-brand-gold': variant === 'gold',
            'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
            'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': variant === 'warning',
            'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'danger',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
export default Badge;
