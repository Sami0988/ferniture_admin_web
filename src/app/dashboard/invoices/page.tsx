'use client';

import { useState } from 'react';
import { useGetInvoicesQuery } from '@/store/api/invoicesApi';
import { cn, formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  unpaid: 'danger',
  partial: 'warning',
  paid: 'success',
};

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: invoicesData, isLoading } = useGetInvoicesQuery({
    paymentStatus: statusFilter === 'all' ? undefined : statusFilter as any,
    search: search || undefined,
    page,
    limit,
  });

  const invoices = invoicesData?.data ?? [];
  const meta = (invoicesData as any)?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted">{total} total invoices</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search invoices..."
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {['all', 'unpaid', 'partial', 'paid'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                statusFilter === s ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">No invoices found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Invoice</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Project</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Total</th>
                  <th className="pb-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted" />
                        <span className="text-sm font-mono font-medium text-foreground">{inv.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-foreground">{inv.customerName}</td>
                    <td className="py-3 text-sm text-muted max-w-[200px] truncate">{inv.projectTitle}</td>
                    <td className="py-3 text-right text-sm font-medium text-foreground">{formatCurrency(parseFloat(inv.totalAmount))}</td>
                    <td className="py-3 text-center"><Badge variant={statusVariant[inv.paymentStatus]}>{inv.paymentStatus}</Badge></td>
                    <td className="py-3 text-right">
                      <Link href={`/dashboard/invoices/${inv.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
