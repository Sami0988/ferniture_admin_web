'use client';

import { useState } from 'react';
import { useGetPaymentLettersQuery } from '@/store/api/paymentLettersApi';
import { cn, formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { Mail, Eye, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useDeletePaymentLetterMutation } from '@/store/api/paymentLettersApi';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  draft: 'warning',
  sent: 'default',
  paid: 'success',
};

export default function PaymentLettersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 20;

  const { data: lettersData, isLoading } = useGetPaymentLettersQuery({
    status: statusFilter === 'all' ? undefined : (statusFilter as any),
    page,
    limit,
  });
  const [deleteLetter, { isLoading: isDeleting }] = useDeletePaymentLetterMutation();

  const letters = lettersData?.data ?? [];
  const meta = (lettersData as any)?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLetter(deleteId).unwrap();
      toast.success('Payment letter deleted');
      setDeleteId(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete letter';
      toast.error(message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Letters</h1>
          <p className="text-sm text-muted">{total} total letters</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search letters..."
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {['all', 'draft', 'sent', 'paid'].map((s) => (
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
            <div className="p-8 text-center text-sm text-muted">Loading letters...</div>
          ) : letters.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">No payment letters found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Letter #</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Project</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Recipient</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Subject</th>
                  <th className="pb-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {letters.map((letter) => (
                  <tr key={letter.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted" />
                        <span className="text-sm font-mono font-medium text-foreground">{letter.letterNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-foreground max-w-[180px] truncate">{letter.projectTitle || '—'}</td>
                    <td className="py-3 text-sm text-foreground max-w-[160px] truncate">{letter.recipientCompanyName}</td>
                    <td className="py-3 text-sm text-muted max-w-[220px] truncate">{letter.subject}</td>
                    <td className="py-3 text-center"><Badge variant={statusVariant[letter.status]}>{letter.status}</Badge></td>
                    <td className="py-3 text-right text-sm text-muted">{formatDate(letter.createdAt)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/payment-letters/${letter.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                        {letter.status === 'draft' && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(letter.id)}>
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

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Payment Letter"
        message="Are you sure you want to delete this draft letter? This action cannot be undone."
        loading={isDeleting}
      />
    </motion.div>
  );
}
