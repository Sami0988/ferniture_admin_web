'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} from '@/store/api/adminApi';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import { HelpCircle, Plus, Pencil, Trash2, GripVertical, CheckCircle, XCircle } from 'lucide-react';
import TranslationTabs from '@/components/ui/TranslationTabs';
import type { Locale } from '@/components/ui/TranslationTabs';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { WebsiteFaq } from '@/types/api';

export default function FaqsPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: faqsData, isLoading } = useGetFaqsQuery({ page, limit });
  const [createFaq, { isLoading: isCreating }] = useCreateFaqMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqMutation();
  const [deleteFaq, { isLoading: isDeleting }] = useDeleteFaqMutation();

  const allFaqs = useMemo(() => {
    const data = faqsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [faqsData]);

  const faqs = useMemo(() => {
    let filtered = allFaqs;
    if (activeFilter === 'active') filtered = filtered.filter((f) => f.isActive);
    if (activeFilter === 'inactive') filtered = filtered.filter((f) => !f.isActive);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allFaqs, activeFilter, search]);

  const pagination = faqsData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, activeFilter]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<WebsiteFaq | null>(null);

  // Form state
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formLocale, setFormLocale] = useState<Locale>('en');
  const [formTranslations, setFormTranslations] = useState<Record<string, Record<string, string>>>({});

  // Delete state
  const [deletingFaq, setDeletingFaq] = useState<WebsiteFaq | null>(null);

  const resetForm = () => {
    setFormQuestion('');
    setFormAnswer('');
    setFormSortOrder(0);
    setFormIsActive(true);
    setFormLocale('en');
    setFormTranslations({});
    setEditingFaq(null);
  };

  const getFormValue = (field: string, enValue: string) => {
    if (formLocale === 'en') return enValue;
    return formTranslations[formLocale]?.[field] || '';
  };

  const setFormValue = (field: string, value: string) => {
    if (formLocale === 'en') {
      if (field === 'question') setFormQuestion(value);
      else if (field === 'answer') setFormAnswer(value);
    } else {
      setFormTranslations((prev) => ({
        ...prev,
        [formLocale]: { ...prev[formLocale], [field]: value },
      }));
    }
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (faq: WebsiteFaq) => {
    setEditingFaq(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormSortOrder(faq.sortOrder);
    setFormIsActive(faq.isActive);
    setFormLocale('en');
    setFormTranslations((faq as any).translations || {});
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formQuestion.trim()) {
      toast.error('Question is required');
      return;
    }
    if (!formAnswer.trim()) {
      toast.error('Answer is required');
      return;
    }

    try {
      if (editingFaq) {
        await updateFaq({
          id: editingFaq.id,
          data: {
            question: formQuestion.trim(),
            answer: formAnswer.trim(),
            sortOrder: formSortOrder,
            isActive: formIsActive,
            translations: Object.keys(formTranslations).length > 0 ? formTranslations : undefined,
          },
        }).unwrap();
        toast.success('FAQ updated successfully');
      } else {
        await createFaq({
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          sortOrder: formSortOrder,
          isActive: formIsActive,
          translations: Object.keys(formTranslations).length > 0 ? formTranslations : undefined,
        }).unwrap();
        toast.success('FAQ created successfully');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to save FAQ';
      toast.error(message);
    }
  };

  const handleToggleActive = async (faq: WebsiteFaq) => {
    try {
      await updateFaq({
        id: faq.id,
        data: { isActive: !faq.isActive },
      }).unwrap();
      toast.success(faq.isActive ? 'FAQ hidden from public site' : 'FAQ shown on public site');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update FAQ';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingFaq) return;
    try {
      await deleteFaq(deletingFaq.id).unwrap();
      toast.success('FAQ deleted');
      setDeletingFaq(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete FAQ';
      toast.error(message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQs</h1>
          <p className="text-sm text-muted">{pagination?.total ?? faqs.length} frequently asked questions</p>
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
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add FAQ
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search FAQs..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                activeFilter === filter ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-12">#</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Question</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Answer</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-20">Order</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-24">Status</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {faqs.map((faq, idx) => (
                <tr key={faq.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 text-sm text-muted font-mono">{(page - 1) * limit + idx + 1}</td>
                  <td className="py-3">
                    <p className="text-sm font-medium text-foreground max-w-md truncate">{faq.question}</p>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-muted max-w-lg truncate">{faq.answer}</p>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-muted font-mono">{faq.sortOrder}</span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleToggleActive(faq)}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 transition-colors',
                        faq.isActive
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-red-500 bg-red-50 hover:bg-red-100'
                      )}
                    >
                      {faq.isActive ? (
                        <><CheckCircle className="h-3 w-3" /> Active</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(faq)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingFaq(faq)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    {isLoading ? 'Loading FAQs...' : 'No FAQs found'}
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

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}
      >
        <div className="space-y-4">
          <TranslationTabs locale={formLocale} onChange={setFormLocale} />
          <Input
            label={formLocale === 'en' ? 'Question *' : 'Question * (Amharic)'}
            value={getFormValue('question', formQuestion)}
            onChange={(e) => setFormValue('question', e.target.value)}
            placeholder="How long does a custom order take?"
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {formLocale === 'en' ? 'Answer *' : 'Answer * (Amharic)'}
            </label>
            <textarea
              value={getFormValue('answer', formAnswer)}
              onChange={(e) => setFormValue('answer', e.target.value)}
              placeholder="Typically 2-4 weeks depending on complexity..."
              rows={4}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-none"
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            value={String(formSortOrder)}
            onChange={(e) => setFormSortOrder(Number(e.target.value))}
            placeholder="0"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Visible on public site</label>
            <button
              type="button"
              onClick={() => setFormIsActive(!formIsActive)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                formIsActive ? 'bg-brand-gold' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  formIsActive ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isCreating || isUpdating}>
              {editingFaq ? 'Save Changes' : 'Add FAQ'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingFaq}
        onClose={() => setDeletingFaq(null)}
        onConfirm={handleDelete}
        title="Delete FAQ"
        message={`Are you sure you want to delete "${deletingFaq?.question}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </motion.div>
  );
}
