'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchSuppliersQuery, useGetSuppliersQuery } from '@/store/api/suppliersApi';
import { cn } from '@/lib/utils';
import { ChevronDown, X, Search, Plus } from 'lucide-react';

interface SupplierOption {
  id: string;
  companyName: string;
  tinNumber: string;
  phone: string | null;
  address: string | null;
}

interface SupplierSelectProps {
  value: SupplierOption | null;
  onChange: (supplier: SupplierOption | null) => void;
  error?: string;
  disabled?: boolean;
  onCreateNew?: () => void;
}

export default function SupplierSelect({ value, onChange, error, disabled, onCreateNew }: SupplierSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = search.length >= 2 ? search : '';
  const { data: searchResults, isFetching: isSearching } = useSearchSuppliersQuery(debouncedSearch, {
    skip: !debouncedSearch,
  });
  const { data: initialData, isFetching: isLoadingInitial } = useGetSuppliersQuery({ limit: 50 }, {
    skip: !!debouncedSearch || !open,
  });

  const isFetching = isSearching || isLoadingInitial;
  const suppliers: SupplierOption[] = debouncedSearch
    ? (Array.isArray(searchResults) ? searchResults : [])
    : (Array.isArray(initialData?.data) ? initialData.data : []).map((s: any) => ({ id: s.id, companyName: s.companyName, tinNumber: s.tinNumber, phone: s.phone ?? null, address: s.address ?? null }));

  const handleSelect = useCallback((supplier: SupplierOption) => {
    onChange(supplier);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-foreground mb-1.5">Supplier *</label>
      <button
        type="button"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border bg-surface px-3 py-2 text-sm text-left transition-colors',
          error ? 'border-red-500' : 'border-border',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-muted'
        )}
      >
        {value ? (
          <span className="text-foreground truncate">
            {value.companyName} <span className="text-muted ml-1">({value.tinNumber})</span>
          </span>
        ) : (
          <span className="text-muted">Search suppliers by name or TIN...</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span onClick={handleClear} className="rounded p-0.5 hover:bg-surface-hover">
              <X className="h-3.5 w-3.5 text-muted" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {isFetching && (
              <div className="px-3 py-2 text-sm text-muted">Searching...</div>
            )}
            {!isFetching && debouncedSearch && suppliers.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted">
                <p>No suppliers found</p>
                {onCreateNew && (
                  <button
                    type="button"
                    onClick={() => { onCreateNew(); setOpen(false); setSearch(''); }}
                    className="mt-1 flex items-center gap-1 text-brand-gold hover:text-brand-gold/80 text-xs font-medium"
                  >
                    <Plus className="h-3 w-3" />
                    Create new supplier
                  </button>
                )}
              </div>
            )}
            {!isFetching && !debouncedSearch && suppliers.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted">No suppliers available</div>
            )}
            {suppliers.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                onClick={() => handleSelect(supplier)}
                className={cn(
                  'flex w-full flex-col px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover',
                  value?.id === supplier.id && 'bg-brand-gold/10'
                )}
              >
                <span className="font-medium text-foreground">{supplier.companyName}</span>
                <span className="text-xs text-muted">TIN: {supplier.tinNumber}{supplier.phone ? ` · ${supplier.phone}` : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
