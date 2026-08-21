'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function Toggle({ checked, onChange, label, size = 'md', className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:ring-offset-2 focus:ring-offset-surface',
        checked ? 'bg-brand-gold' : 'bg-border',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          checked
            ? size === 'sm' ? 'translate-x-4' : 'translate-x-5'
            : 'translate-x-0'
        )}
      />
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </button>
  );
}
