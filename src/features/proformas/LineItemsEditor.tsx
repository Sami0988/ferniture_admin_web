'use client';

import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import type { ProformaItem, ProformaUnit, ProformaItemType } from '@/types/api';
import { PROFORMA_ITEM_TYPES } from '@/types/api';

const unitOptions: { value: ProformaUnit; label: string }[] = [
  { value: 'PCS', label: 'PCS' },
  { value: 'M2', label: 'M2' },
  { value: 'ML', label: 'ML' },
  { value: 'SET', label: 'SET' },
  { value: 'LOT', label: 'LOT' },
  { value: 'KG', label: 'KG' },
];

const emptyItem = (): Omit<ProformaItem, 'id'> => ({
  description: 'aluminum_partition',
  quantity: 1,
  unit: 'PCS',
  unitPrice: 0,
  total: 0,
  sortOrder: 0,
});

interface LineItemsEditorProps {
  items: ProformaItem[];
  onChange: (items: ProformaItem[]) => void;
  error?: string;
}

export default function LineItemsEditor({ items, onChange, error }: LineItemsEditorProps) {
  const handleChange = (index: number, field: keyof ProformaItem, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, [field]: value };
      next.total = next.quantity * next.unitPrice;
      return next;
    });
    onChange(updated);
  };

  const addItem = () => {
    const newItem: ProformaItem = {
      id: `temp-${Date.now()}`,
      ...emptyItem(),
      sortOrder: items.length,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const filtered = items.filter((_, i) => i !== index);
    const reindexed = filtered.map((item, i) => ({ ...item, sortOrder: i }));
    onChange(reindexed);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left text-xs font-semibold text-muted uppercase w-[280px]">Item</th>
              <th className="pb-2 text-center text-xs font-semibold text-muted uppercase w-20">Qty</th>
              <th className="pb-2 text-center text-xs font-semibold text-muted uppercase w-32">Unit</th>
              <th className="pb-2 text-right text-xs font-semibold text-muted uppercase w-28">Unit Price</th>
              <th className="pb-2 text-right text-xs font-semibold text-muted uppercase w-28">Total</th>
              <th className="pb-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {items.map((item, index) => (
              <tr key={item.id} className="group">
                <td className="py-2 pr-2">
                  <select
                    value={item.description}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                    className="flex w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  >
                    {PROFORMA_ITEM_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    className="flex w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  />
                </td>
                <td className="py-2 pr-2 w-32">
                  <select
                    value={item.unit}
                    onChange={(e) => handleChange(index, 'unit', e.target.value)}
                    className="flex w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  >
                    {unitOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="flex w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  />
                </td>
                <td className="py-2 pl-3 text-right text-sm font-medium text-foreground whitespace-nowrap">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
                <td className="py-2 pl-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded p-1 text-muted hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button type="button" variant="ghost" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4" /> Add line item
      </Button>
    </div>
  );
}
