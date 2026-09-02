import type { ProformaItem } from '@/types/api';

interface ProformaTotals {
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

export function useProformaTotals(
  items: ProformaItem[],
  vatRate: number,
  discountAmount: number
): ProformaTotals {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  const taxableAmount = subtotal - discountAmount;
  const vatAmount = taxableAmount * (vatRate / 100);
  const totalAmount = taxableAmount + vatAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}
