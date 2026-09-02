'use client';

import { cn, formatCurrency } from '@/lib/utils';
import type { ProformaItem } from '@/types/api';
import { useProformaTotals } from './useProformaTotals';

interface TotalsPanelProps {
  items: ProformaItem[];
  vatRate: number;
  discountAmount: number;
  readOnly?: boolean;
  onVatRateChange?: (rate: number) => void;
  onDiscountChange?: (amount: number) => void;
}

export default function TotalsPanel({
  items,
  vatRate,
  discountAmount,
  readOnly = false,
  onVatRateChange,
  onDiscountChange,
}: TotalsPanelProps) {
  const { subtotal, vatAmount, totalAmount } = useProformaTotals(items, vatRate, discountAmount);

  return (
    <div className="w-full max-w-xs ml-auto space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted">Subtotal</span>
        <span className="text-foreground">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted">Discount</span>
        {readOnly ? (
          <span className={cn('text-foreground', discountAmount > 0 && 'text-green-600')}>
            {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : formatCurrency(0)}
          </span>
        ) : (
          <input
            type="number"
            value={discountAmount}
            onChange={(e) => onDiscountChange?.(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-28 rounded-lg border border-border bg-surface px-3 py-1 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
          />
        )}
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted">VAT</span>
        {readOnly ? (
          <span className="text-foreground">
            {formatCurrency(vatAmount)} ({vatRate}%)
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={vatRate}
              onChange={(e) => onVatRateChange?.(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.5"
              className="w-16 rounded-lg border border-border bg-surface px-3 py-1 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
            />
            <span className="text-sm text-muted">%</span>
            <span className="text-sm text-foreground ml-2">{formatCurrency(vatAmount)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between text-base font-bold border-t border-border pt-2">
        <span className="text-foreground">Total</span>
        <span className="text-foreground">{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}
