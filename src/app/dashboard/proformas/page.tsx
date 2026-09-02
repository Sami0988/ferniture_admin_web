'use client';

import { useState } from 'react';
import { useGetProformasQuery, useDeleteProformaMutation } from '@/store/api/proformasApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import StatusBadge from '@/features/proformas/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { FileSpreadsheet, Eye, Edit3, Trash2, ChevronLeft, ChevronRight, Plus, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { ProformaStatus } from '@/types/api';

const statusFilters: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ProformasPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deletingProforma, setDeletingProforma] = useState<{ id: string; number: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [limit, setLimit] = useState(20);

  const { data: proformasData, isLoading } = useGetProformasQuery({
    status: statusFilter === 'all' ? undefined : (statusFilter as ProformaStatus),
    search: search || undefined,
    page,
    limit,
  });

  const [deleteProforma] = useDeleteProformaMutation();

  const proformas = proformasData?.data ?? [];
  const meta = (proformasData as any)?.pagination;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const handleDelete = async () => {
    if (!deletingProforma) return;
    setDeleteLoading(true);
    try {
      await deleteProforma(deletingProforma.id).unwrap();
      toast.success('Proforma deleted');
      setDeletingProforma(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete proforma');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proformas</h1>
          <p className="text-sm text-muted">{total} total proformas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(limit)}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            options={[
              { value: '10', label: '10 per page' },
              { value: '20', label: '20 per page' },
              { value: '50', label: '50 per page' },
              { value: '100', label: '100 per page' },
            ]}
          />
          <Link href="/dashboard/proformas/new">
            <Button>
              <Plus className="h-4 w-4" /> New Proforma
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search proformas..."
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1); }}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                statusFilter === s.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted">Loading proformas...</div>
          ) : proformas.length === 0 ? (
            <div className="p-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No proformas found</p>
              <p className="text-xs text-muted mb-4">Create your first proforma to get started</p>
              <Link href="/dashboard/proformas/new">
                <Button size="sm"><Plus className="h-4 w-4" /> Create proforma</Button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Number</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Billed To</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Total</th>
                  <th className="pb-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {proformas.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted" />
                        <span className="text-sm font-mono font-medium text-foreground">{p.proformaNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-foreground">{p.billedToName}</td>
                    <td className="py-3 text-sm text-muted">{formatDate(p.createdAt)}</td>
                    <td className="py-3 text-right text-sm font-medium text-foreground">{formatCurrency(p.totalAmount)}</td>
                    <td className="py-3 text-center"><StatusBadge status={p.status} /></td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/proformas/${p.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                        {p.status === 'draft' && (
                          <Link href={`/dashboard/proformas/${p.id}/edit`}>
                            <Button variant="ghost" size="sm"><Edit3 className="h-3.5 w-3.5" /></Button>
                          </Link>
                        )}
                        {p.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingProforma({ id: p.id, number: p.proformaNumber })}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {total > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                    page === pageNum ? 'bg-brand-gold text-white' : 'text-muted hover:bg-surface-hover'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingProforma}
        onClose={() => setDeletingProforma(null)}
        onConfirm={handleDelete}
        title="Delete Proforma"
        message={`Are you sure you want to delete ${deletingProforma?.number}? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </motion.div>
  );
}
