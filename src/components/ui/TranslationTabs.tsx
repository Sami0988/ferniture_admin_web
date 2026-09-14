'use client';

import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

type Locale = 'en' | 'am';

interface TranslationTabsProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
  className?: string;
}

const locales = [
  { value: 'en' as const, label: 'English', flag: '🇬🇧' },
  { value: 'am' as const, label: 'Amharic', flag: '🇪🇹' },
];

export default function TranslationTabs({ locale, onChange, className }: TranslationTabsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Globe className="h-4 w-4 text-muted" />
      <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
        {locales.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => onChange(l.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              locale === l.value
                ? 'bg-brand-gold text-white'
                : 'text-muted hover:text-foreground hover:bg-surface-hover'
            )}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { Locale };
