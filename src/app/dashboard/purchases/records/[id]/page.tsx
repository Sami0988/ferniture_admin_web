'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetPurchaseByIdQuery } from '@/store/api/purchasesApi';
import { usePermission } from '@/hooks/usePermission';
import { formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft, Pencil, Building2, FileText, Calendar, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { canDelete } = usePermission();
  const id = params.id as string;

  const { data: response, isLoading, error } = useGetPurchaseByIdQuery(id);
  const purchase = response?.data;

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 lg:col-span-2" />
        </div>
        <Skeleton className="h-64" />
      </motion.div>
    );
  }

  if (error || !purchase) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/purchases/records')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Purchase Not Found</h1>
        </div>
        <Card>
          <div className="py-12 text-center text-sm text-muted">
            This purchase record could not be loaded. It may have been deleted.
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/purchases/records')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Purchase {purchase.fsNumber}</h1>
            <p className="text-sm text-muted">Recorded on {formatDate(purchase.createdAt)}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/purchases/records')}>
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-muted" />
              Supplier Information
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Company</p>
                <p className="text-sm font-medium text-foreground">{purchase.supplierName}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">TIN</p>
                <p className="text-sm font-mono text-foreground">{purchase.supplierTin}</p>
              </div>
              {purchase.supplierPhone && (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider">Phone</p>
                  <p className="text-sm text-foreground">{purchase.supplierPhone}</p>
                </div>
              )}
              {purchase.supplierAddress && (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider">Address</p>
                  <p className="text-sm text-foreground">{purchase.supplierAddress}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-muted" />
              Transaction Details
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">FS Number</p>
                <p className="text-sm font-mono font-medium text-foreground">{purchase.fsNumber}</p>
              </div>
              {purchase.bankTransactionNumber && (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider">Bank Transaction #</p>
                  <p className="text-sm font-mono text-foreground">{purchase.bankTransactionNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Purchase Date</p>
                <p className="text-sm text-foreground">{formatDate(purchase.purchaseDate)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-muted" />
              Financial Summary
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Amount Before VAT</span>
                <span className="text-sm font-medium text-foreground">{formatCurrency(purchase.amountBeforeVat)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">VAT Amount</span>
                <span className="text-sm font-medium text-foreground">{formatCurrency(purchase.vatAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Withholding Tax</span>
                <span className="text-sm font-medium text-foreground">{formatCurrency(purchase.withholdingAmount)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-sm font-semibold text-foreground">Total Amount</span>
                <span className="text-lg font-bold text-brand-gold">{formatCurrency(purchase.totalAmount)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Purchase Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">#</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Material</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Quantity</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Unit Price</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {purchase.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 text-sm text-muted">{idx + 1}</td>
                    <td className="py-3 text-sm font-medium text-foreground">{item.materialName}</td>
                    <td className="py-3 text-sm text-right text-foreground">{Number(item.quantity)}</td>
                    <td className="py-3 text-sm text-right text-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-sm text-right font-medium text-foreground">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={4} className="py-3 text-sm font-semibold text-foreground text-right">Total Before VAT</td>
                  <td className="py-3 text-sm text-right font-bold text-foreground">{formatCurrency(purchase.amountBeforeVat)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
