'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSearchQuery } from '@/store/api/searchApi';
import { Search, Users, Package, Briefcase, Receipt, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

type ResultItem = {
  type: 'customer' | 'supplier' | 'workOrder' | 'purchase';
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

const typeConfig = {
  customer: { icon: Users, label: 'Customers', color: 'text-blue-500' },
  supplier: { icon: Package, label: 'Suppliers', color: 'text-emerald-500' },
  workOrder: { icon: Briefcase, label: 'Work Projects', color: 'text-purple-500' },
  purchase: { icon: Receipt, label: 'Purchases', color: 'text-orange-500' },
};

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = query.length >= 2 ? query : '';
  const { data, isFetching } = useGlobalSearchQuery(debouncedQuery, {
    skip: !debouncedQuery,
  });

  const results: ResultItem[] = [];
  if (data) {
    for (const c of data.customers ?? []) {
      results.push({
        type: 'customer',
        id: c.id,
        title: c.fullName,
        subtitle: [c.phone, c.email].filter(Boolean).join(' · '),
        href: `/dashboard/customers/${c.id}`,
      });
    }
    for (const s of data.suppliers ?? []) {
      results.push({
        type: 'supplier',
        id: s.id,
        title: s.companyName,
        subtitle: `TIN: ${s.tinNumber}${s.phone ? ` · ${s.phone}` : ''}`,
        href: `/dashboard/purchases/suppliers?search=${encodeURIComponent(s.companyName)}`,
      });
    }
    for (const w of data.workOrders ?? []) {
      results.push({
        type: 'workOrder',
        id: w.id,
        title: w.title || w.projectNumber,
        subtitle: w.clientName || w.projectNumber,
        href: `/dashboard/workorders/${w.id}`,
      });
    }
    for (const p of data.purchases ?? []) {
      results.push({
        type: 'purchase',
        id: p.id,
        title: p.fsNumber,
        subtitle: p.supplierName,
        href: `/dashboard/purchases/records/${p.id}`,
      });
    }
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        navigate(results[selectedIndex].href);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, navigate, onClose]);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl rounded-xl border border-border bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suppliers, customers, projects, purchases..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-surface-hover px-1.5 py-0.5 text-[10px] text-muted font-medium">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {isFetching && debouncedQuery && (
            <div className="px-4 py-6 text-center text-sm text-muted">Searching...</div>
          )}

          {!isFetching && debouncedQuery && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">
              No results for &quot;{query}&quot;
            </div>
          )}

          {!debouncedQuery && (
            <div className="px-4 py-6 text-center text-sm text-muted">
              Type at least 2 characters to search
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {(['customer', 'supplier', 'workOrder', 'purchase'] as const).map((type) => {
                const items = results.filter((r) => r.type === type);
                if (items.length === 0) return null;
                const config = typeConfig[type];
                const Icon = config.icon;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <Icon className={cn('h-3.5 w-3.5', config.color)} />
                      <span className="text-xs font-medium text-muted uppercase tracking-wider">{config.label}</span>
                    </div>
                    {items.map((item) => {
                      const globalIndex = results.indexOf(item);
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => navigate(item.href)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            globalIndex === selectedIndex ? 'bg-surface-hover' : 'hover:bg-surface-hover/50'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                            <p className="text-xs text-muted truncate">{item.subtitle}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted shrink-0 opacity-0 group-hover:opacity-100" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
