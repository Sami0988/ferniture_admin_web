'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useGetTestimonialsQuery,
  useCreateTestimonialMutation,
  useApproveTestimonialMutation,
  useToggleTestimonialFeaturedMutation,
  useDeleteTestimonialMutation,
} from '@/store/api/adminApi';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import {
  Plus,
  Star,
  StarHalf,
  CheckCircle,
  XCircle,
  Trash2,
  Sparkles,
  Quote,
} from 'lucide-react';
import TranslationTabs from '@/components/ui/TranslationTabs';
import type { Locale } from '@/components/ui/TranslationTabs';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { WebsiteTestimonial } from '@/types/api';

function StarRating({ rating }: { rating: number }) {
  const stars: ('full' | 'half' | 'empty')[] = [];
  const clamped = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) stars.push('full');
    else if (i === fullStars && hasHalf) stars.push('half');
    else stars.push('empty');
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((type, i) => (
        <span key={i} className="relative">
          {type === 'full' && <Star className="h-4 w-4 fill-brand-gold text-brand-gold" />}
          {type === 'half' && (
            <span className="relative inline-block">
              <Star className="h-4 w-4 text-border" />
              <span className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="h-4 w-4 fill-brand-gold text-brand-gold" />
              </span>
            </span>
          )}
          {type === 'empty' && <Star className="h-4 w-4 text-border" />}
        </span>
      ))}
      <span className="ml-1 text-xs font-medium text-muted">{rating}</span>
    </div>
  );
}

export default function TestimonialsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: testimonialsData, isLoading } = useGetTestimonialsQuery({ page, limit });
  const [createTestimonial, { isLoading: isCreating }] = useCreateTestimonialMutation();
  const [approveTestimonial] = useApproveTestimonialMutation();
  const [toggleFeatured] = useToggleTestimonialFeaturedMutation();
  const [deleteTestimonial, { isLoading: isDeleting }] = useDeleteTestimonialMutation();

  const allTestimonials = useMemo(() => {
    const data = testimonialsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [testimonialsData]);

  const testimonials = useMemo(() => {
    let filtered = allTestimonials;
    if (statusFilter === 'pending') filtered = filtered.filter((t) => !t.isApproved);
    if (statusFilter === 'approved') filtered = filtered.filter((t) => t.isApproved && !t.isFeatured);
    if (statusFilter === 'featured') filtered = filtered.filter((t) => t.isFeatured);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.customerName.toLowerCase().includes(q) ||
          t.reviewText.toLowerCase().includes(q) ||
          (t.company && t.company.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [allTestimonials, statusFilter, search]);

  const pagination = testimonialsData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const [deletingTestimonial, setDeletingTestimonial] = useState<WebsiteTestimonial | null>(null);

  // Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formReviewText, setFormReviewText] = useState('');
  const [formLocale, setFormLocale] = useState<Locale>('en');
  const [formTranslations, setFormTranslations] = useState<Record<string, Record<string, string>>>({});

  const resetCreateForm = () => {
    setFormCustomerName('');
    setFormCompany('');
    setFormRating(5);
    setFormReviewText('');
    setFormLocale('en');
    setFormTranslations({});
  };

  const getFormValue = (field: string, enValue: string) => {
    if (formLocale === 'en') return enValue;
    return formTranslations[formLocale]?.[field] || '';
  };

  const setFormValue = (field: string, value: string) => {
    if (formLocale === 'en') {
      if (field === 'customerName') setFormCustomerName(value);
      else if (field === 'company') setFormCompany(value);
      else if (field === 'reviewText') setFormReviewText(value);
    } else {
      setFormTranslations((prev) => ({
        ...prev,
        [formLocale]: { ...prev[formLocale], [field]: value },
      }));
    }
  };

  const handleCreate = async () => {
    if (!formCustomerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!formReviewText.trim()) {
      toast.error('Review text is required');
      return;
    }
    try {
      await createTestimonial({
        customerName: formCustomerName.trim(),
        company: formCompany.trim() || undefined,
        rating: formRating,
        reviewText: formReviewText.trim(),
        translations: Object.keys(formTranslations).length > 0 ? formTranslations : undefined,
      }).unwrap();
      toast.success('Testimonial created');
      setModalOpen(false);
      resetCreateForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to create testimonial';
      toast.error(message);
    }
  };

  const handleApprove = async (testimonial: WebsiteTestimonial) => {
    try {
      await approveTestimonial(testimonial.id).unwrap();
      toast.success(`Approved testimonial from ${testimonial.customerName}`);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to approve';
      toast.error(message);
    }
  };

  const handleToggleFeatured = async (testimonial: WebsiteTestimonial) => {
    try {
      await toggleFeatured(testimonial.id).unwrap();
      toast.success(testimonial.isFeatured ? 'Removed from featured' : 'Added to featured');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingTestimonial) return;
    try {
      await deleteTestimonial(deletingTestimonial.id).unwrap();
      toast.success('Testimonial deleted');
      setDeletingTestimonial(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete';
      toast.error(message);
    }
  };

  const pendingCount = allTestimonials.filter((t) => !t.isApproved).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Testimonials</h1>
          <p className="text-sm text-muted">
            {pagination?.total ?? testimonials.length} testimonials
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                {pendingCount} pending
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
          <Button onClick={() => { resetCreateForm(); setModalOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, company, or review..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {[
            { value: 'all' as const, label: 'All' },
            { value: 'pending' as const, label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { value: 'approved' as const, label: 'Approved' },
            { value: 'featured' as const, label: 'Featured' },
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
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Rating</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Review</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-24">Status</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-28">Date</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {testimonials.map((t) => (
                <tr key={t.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {t.imageUrl ? (
                        <img src={t.imageUrl} alt="" className="h-9 w-9 rounded-full object-cover border border-border shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                          {t.customerName?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.customerName}</p>
                        {t.company && (
                          <p className="text-xs text-muted truncate">{t.company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <StarRating rating={t.rating} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-start gap-2 max-w-md">
                      <Quote className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                      <p className="text-sm text-muted line-clamp-2">{t.reviewText}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      {t.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                          <XCircle className="h-3 w-3" /> Pending
                        </span>
                      )}
                      {t.isFeatured && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-brand-gold">
                          <Sparkles className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-sm text-muted">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!t.isApproved && (
                        <Button variant="secondary" size="sm" onClick={() => handleApprove(t)}>
                          Approve
                        </Button>
                      )}
                      <Button
                        variant={t.isFeatured ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => handleToggleFeatured(t)}
                        title={t.isFeatured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <Sparkles className={cn('h-3.5 w-3.5', t.isFeatured && 'fill-brand-gold text-brand-gold')} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTestimonial(t)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {testimonials.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    {isLoading ? 'Loading testimonials...' : 'No testimonials found'}
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

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetCreateForm(); }}
        title="Add Testimonial"
      >
        <div className="space-y-4">
          <TranslationTabs locale={formLocale} onChange={setFormLocale} />
          <Input
            label={formLocale === 'en' ? 'Customer Name *' : 'Customer Name * (Amharic)'}
            value={getFormValue('customerName', formCustomerName)}
            onChange={(e) => setFormValue('customerName', e.target.value)}
            placeholder="John Doe"
          />
          <Input
            label={formLocale === 'en' ? 'Company (optional)' : 'Company (optional, Amharic)'}
            value={getFormValue('company', formCompany)}
            onChange={(e) => setFormValue('company', e.target.value)}
            placeholder="ABC Construction"
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Rating *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      'h-6 w-6 transition-colors',
                      star <= formRating
                        ? 'fill-brand-gold text-brand-gold'
                        : 'text-border hover:text-brand-gold/50'
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted">{formRating}/5</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Review *</label>
            <textarea
              value={getFormValue('reviewText', formReviewText)}
              onChange={(e) => setFormValue('reviewText', e.target.value)}
              placeholder="Excellent work! Highly recommended..."
              rows={4}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={isCreating} disabled={isCreating}>
              Create Testimonial
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingTestimonial}
        onClose={() => setDeletingTestimonial(null)}
        onConfirm={handleDelete}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from "${deletingTestimonial?.customerName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </motion.div>
  );
}
