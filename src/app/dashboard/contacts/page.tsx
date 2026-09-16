'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useGetContactsQuery,
  useUpdateContactStatusMutation,
} from '@/store/api/adminApi';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import {
  Mail,
  MailOpen,
  Reply,
  Archive,
  Eye,
  User,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { WebsiteContact } from '@/types/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'text-blue-600 bg-blue-50', icon: Mail },
  read: { label: 'Read', color: 'text-amber-600 bg-amber-50', icon: MailOpen },
  replied: { label: 'Replied', color: 'text-green-600 bg-green-50', icon: Reply },
  archived: { label: 'Archived', color: 'text-gray-600 bg-gray-50', icon: Archive },
};

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewingContact, setViewingContact] = useState<WebsiteContact | null>(null);

  const { data: contactsData, isLoading } = useGetContactsQuery({ page, limit });
  const [updateContactStatus] = useUpdateContactStatusMutation();

  const allContacts = useMemo(() => {
    const data = contactsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [contactsData]);

  const contacts = useMemo(() => {
    let filtered = allContacts;
    if (statusFilter !== 'all') filtered = filtered.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.subject && c.subject.toLowerCase().includes(q)) ||
          c.message.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allContacts, statusFilter, search]);

  const pagination = contactsData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleStatusUpdate = async (contact: WebsiteContact, newStatus: string) => {
    try {
      await updateContactStatus({ id: contact.id, status: newStatus }).unwrap();
      toast.success(`Message marked as ${newStatus}`);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update status';
      toast.error(message);
    }
  };

  const newCount = allContacts.filter((c) => c.status === 'new').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>
          <p className="text-sm text-muted">
            {pagination?.total ?? contacts.length} messages
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
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, subject..." />
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
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Subject</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Message</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-24">Status</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-28">Date</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {contacts.map((c) => {
                const statusInfo = statusConfig[c.status] || statusConfig.new;
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                          {c.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                          <p className="text-xs text-muted truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-foreground truncate max-w-[200px]">{c.subject || '—'}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-muted line-clamp-2 max-w-md">{c.message}</p>
                    </td>
                    <td className="py-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', statusInfo.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-muted">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingContact(c)}
                          title="View message"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {c.status === 'new' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusUpdate(c, 'read')}
                          >
                            Mark Read
                          </Button>
                        )}
                        {c.status === 'read' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusUpdate(c, 'replied')}
                          >
                            Mark Replied
                          </Button>
                        )}
                        {c.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(c, 'archived')}
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
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    {isLoading ? 'Loading messages...' : 'No contact messages found'}
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

      {/* View Contact Modal */}
      {viewingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewingContact(null)}>
          <div
            className="bg-surface rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Message Details</h2>
              <button onClick={() => setViewingContact(null)} className="text-muted hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">{viewingContact.name}</p>
                  <p className="text-xs text-muted">{viewingContact.email}</p>
                  {viewingContact.phone && <p className="text-xs text-muted">{viewingContact.phone}</p>}
                </div>
              </div>
              {viewingContact.subject && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-foreground">{viewingContact.subject}</p>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted whitespace-pre-wrap">{viewingContact.message}</p>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  statusConfig[viewingContact.status]?.color
                )}>
                  {statusConfig[viewingContact.status]?.label}
                </span>
                <span className="text-xs text-muted">{formatDate(viewingContact.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
