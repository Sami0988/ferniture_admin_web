'use client';

import { useState } from 'react';
import { useGetInvoicesQuery } from '@/store/api/invoicesApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { FileText, Eye, Printer, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { ApiInvoice } from '@/types/api';
import Link from 'next/link';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  sent: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'default',
};

export default function InvoicesPage() {
  const { data: invoicesData } = useGetInvoicesQuery({});
  const invoices = invoicesData?.data ?? [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.project?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted">{invoices.length} total invoices</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Invoice</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Project</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Amount</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Due Date</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted" />
                      <span className="text-sm font-mono font-medium text-foreground">{inv.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-foreground">{inv.customer?.fullName}</td>
                  <td className="py-3 text-sm text-muted max-w-[200px] truncate">{inv.project?.title}</td>
                  <td className="py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(inv.total)}</p>
                      {inv.balanceDue > 0 && (
                        <p className="text-xs text-red-500">Balance: {formatCurrency(inv.balanceDue)}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3"><Badge variant={statusVariant[inv.status]}>{inv.status}</Badge></td>
                  <td className="py-3 text-sm text-muted">{formatDate(inv.dueDate)}</td>
                  <td className="py-3 text-right">
                    <Link href={`/dashboard/invoices/${inv.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
