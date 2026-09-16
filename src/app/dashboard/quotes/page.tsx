'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useGetQuotesQuery,
  useUpdateQuoteStatusMutation,
} from '@/store/api/adminApi';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import {
  FileText,
  Mail,
  MailOpen,
  Reply,
  Archive,
  Eye,
  User,
  Phone,
  Hammer,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { WebsiteQuote } from '@/types/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'text-blue-600 bg-blue-50', icon: Mail },
  read: { label: 'Read', color: 'text-amber-600 bg-amber-50', icon: MailOpen },
  replied: { label: 'Replied', color: 'text-green-600 bg-green-50', icon: Reply },
  archived: { label: 'Archived', color: 'text-gray-600 bg-gray-50', icon: Archive },
};

const divisionLabels: Record<string, string> = {
  furniture: 'Furniture',
  aluminum: 'Aluminum',
  interior_design: 'Interior Design',
  custom_orders: 'Custom Orders',
  accessories: 'Accessories',
};

export default function QuotesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewingQuote, setViewingQuote] = useState<WebsiteQuote | null>(null);

  const { data: quotesData, isLoading } = useGetQuotesQuery({ page, limit });
  const [updateQuoteStatus] = useUpdateQuoteStatusMutation();

  const allQuotes = useMemo(() => {
    const data = quotesData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [quotesData]);

  const quotes = useMemo(() => {
    let filtered = allQuotes;
    if (statusFilter !== 'all') filtered = filtered.filter((q) => q.status === statusFilter);
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.name.toLowerCase().includes(lowerSearch) ||
          q.email.toLowerCase().includes(lowerSearch) ||
          q.description.toLowerCase().includes(lowerSearch) ||
          (q.division && q.division.toLowerCase().includes(lowerSearch))
      );
    }
    return filtered;
  }, [allQuotes, statusFilter, search]);

  const pagination = quotesData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleStatusUpdate = async (quote: WebsiteQuote, newStatus: string) => {
    try {
      await updateQuoteStatus({ id: quote.id, status: newStatus }).unwrap();
      toast.success(`Quote marked as ${newStatus}`);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update status';
      toast.error(message);
    }
  };

  const newCount = allQuotes.filter((q) => q.status === 'new').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quote Requests</h1>
          <p className="text-sm text-muted">
            {pagination?.total ?? quotes.length} requests
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                {newCount} new
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={String(limit)}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, division..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {[
            { value: 'all' as const, label: 'All' },
            { value: 'new' as const, label: `New${newCount > 0 ? ` (${newCount})` : ''}` },
            { value: 'read' as const, label: 'Read' },
            { value: 'replied' as const, label: 'Replied' },
            { value: 'archived' as const, label: 'Archived' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === filter.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Contact</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Division</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Description</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-24">Status</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-28">Date</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {quotes.map((q) => {
                const statusInfo = statusConfig[q.status] || statusConfig.new;
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={q.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                          {q.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{q.name}</p>
                          <p className="text-xs text-muted truncate">{q.email}</p>
                          {q.phone && <p className="text-xs text-muted truncate">{q.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {q.division ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-foreground">
                          <Hammer className="h-3 w-3" />
                          {divisionLabels[q.division] || q.division}
                        </span>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-muted line-clamp-2 max-w-md">{q.description}</p>
                    </td>
                    <td className="py-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', statusInfo.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-muted">
                      {formatDate(q.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingQuote(q)}
                          title="View quote request"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {q.status === 'new' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusUpdate(q, 'read')}
                          >
                            Mark Read
                          </Button>
                        )}
                        {q.status === 'read' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusUpdate(q, 'replied')}
                          >
                            Mark Replied
                          </Button>
                        )}
                        {q.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(q, 'archived')}
                            title="Archive"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    {isLoading ? 'Loading quote requests...' : 'No quote requests found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                    pagination.page === pageNum
                      ? 'bg-brand-gold text-white'
                      : 'text-muted hover:bg-surface-hover'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Quote Modal */}
      {viewingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewingQuote(null)}>
          <div
            className="bg-surface rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Quote Request Details</h2>
              <button onClick={() => setViewingQuote(null)} className="text-muted hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">{viewingQuote.name}</p>
                  <p className="text-xs text-muted">{viewingQuote.email}</p>
                </div>
              </div>
              {viewingQuote.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted" />
                  <p className="text-sm text-foreground">{viewingQuote.phone}</p>
                </div>
              )}
              {viewingQuote.division && (
                <div className="flex items-center gap-3">
                  <Hammer className="h-4 w-4 text-muted" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-foreground">
                    {divisionLabels[viewingQuote.division] || viewingQuote.division}
                  </span>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Project Description</p>
                <p className="text-sm text-muted whitespace-pre-wrap">{viewingQuote.description}</p>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  statusConfig[viewingQuote.status]?.color
                )}>
                  {statusConfig[viewingQuote.status]?.label}
                </span>
                <span className="text-xs text-muted">{formatDate(viewingQuote.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
