'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  useGetBeforeAfterPairsQuery,
  useCreateBeforeAfterPairMutation,
  useUpdateBeforeAfterPairMutation,
  useDeleteBeforeAfterPairMutation,
} from '@/store/api/beforeAfterApi';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ImageIcon,
  X,
  ArrowRight,
} from 'lucide-react';
import TranslationTabs from '@/components/ui/TranslationTabs';
import type { Locale } from '@/components/ui/TranslationTabs';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { BeforeAfterPair } from '@/types/api';

export default function BeforeAfterPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: pairsData, isLoading } = useGetBeforeAfterPairsQuery({ page, limit });
  const [createPair, { isLoading: isCreating }] = useCreateBeforeAfterPairMutation();
  const [updatePair, { isLoading: isUpdating }] = useUpdateBeforeAfterPairMutation();
  const [deletePair, { isLoading: isDeleting }] = useDeleteBeforeAfterPairMutation();

  const allPairs = useMemo(() => {
    const data = pairsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [pairsData]);

  const pairs = useMemo(() => {
    let filtered = allPairs;
    if (activeFilter === 'active') filtered = filtered.filter((p) => p.isActive);
    if (activeFilter === 'inactive') filtered = filtered.filter((p) => !p.isActive);
    return filtered;
  }, [allPairs, activeFilter]);

  const pagination = pairsData?.pagination;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<BeforeAfterPair | null>(null);
  const [deletingPair, setDeletingPair] = useState<BeforeAfterPair | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formLocale, setFormLocale] = useState<Locale>('en');
  const [formTranslations, setFormTranslations] = useState<Record<string, Record<string, string>>>({});

  // Image refs
  const beforeImageInputRef = useRef<HTMLInputElement>(null);
  const afterImageInputRef = useRef<HTMLInputElement>(null);

  // Image state
  const [formBeforeImage, setFormBeforeImage] = useState<File | null>(null);
  const [beforeImagePreview, setBeforeImagePreview] = useState<string>('');
  const [formAfterImage, setFormAfterImage] = useState<File | null>(null);
  const [afterImagePreview, setAfterImagePreview] = useState<string>('');

  const resetForm = () => {
    setFormTitle('');
    setFormSortOrder(0);
    setFormIsActive(true);
    setFormLocale('en');
    setFormTranslations({});
    setFormBeforeImage(null);
    setBeforeImagePreview('');
    setFormAfterImage(null);
    setAfterImagePreview('');
    setEditingPair(null);
  };

  const getFormValue = (field: string, enValue: string) => {
    if (formLocale === 'en') return enValue;
    return formTranslations[formLocale]?.[field] || '';
  };

  const setFormValue = (field: string, value: string) => {
    if (formLocale === 'en') {
      if (field === 'title') setFormTitle(value);
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

  const openEditModal = (pair: BeforeAfterPair) => {
    setEditingPair(pair);
    setFormTitle(pair.title || '');
    setFormSortOrder(pair.sortOrder);
    setFormIsActive(pair.isActive);
    setFormLocale('en');
    setFormTranslations((pair as any).translations || {});
    setFormBeforeImage(null);
    setBeforeImagePreview(pair.beforeImage || '');
    setFormAfterImage(null);
    setAfterImagePreview(pair.afterImage || '');
    setModalOpen(true);
  };

  const handleBeforeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormBeforeImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBeforeImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAfterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormAfterImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAfterImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!editingPair && !formBeforeImage) {
      toast.error('Before image is required');
      return;
    }
    if (!editingPair && !formAfterImage) {
      toast.error('After image is required');
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: formTitle.trim() || undefined,
        sortOrder: formSortOrder,
        isActive: formIsActive,
        translations: Object.keys(formTranslations).length > 0 ? formTranslations : undefined,
      };
      if (formBeforeImage) payload.beforeImage = formBeforeImage;
      if (formAfterImage) payload.afterImage = formAfterImage;

      if (editingPair) {
        await updatePair({ id: editingPair.id, data: payload }).unwrap();
        toast.success('Pair updated successfully');
      } else {
        await createPair(payload as any).unwrap();
        toast.success('Pair created successfully');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to save pair';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingPair) return;
    try {
      await deletePair(deletingPair.id).unwrap();
      toast.success('Pair deleted');
      setDeletingPair(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete pair';
      toast.error(message);
    }
  };

  const handleToggleActive = async (pair: BeforeAfterPair) => {
    try {
      await updatePair({
        id: pair.id,
        data: { isActive: !pair.isActive },
      }).unwrap();
      toast.success(pair.isActive ? 'Pair hidden from public site' : 'Pair shown on public site');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update pair';
      toast.error(message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Before / After</h1>
          <p className="text-sm text-muted">{pagination?.total ?? pairs.length} comparison pairs</p>
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
            Add Pair
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface w-fit">
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

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-12">#</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Title</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Images</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-20">Order</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-24">Status</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {pairs.map((pair, idx) => (
                <tr key={pair.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 text-sm text-muted font-mono">{(page - 1) * limit + idx + 1}</td>
                  <td className="py-3">
                    <p className="text-sm font-medium text-foreground">{pair.title || '—'}</p>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {pair.beforeImage ? (
                        <img
                          src={pair.beforeImage}
                          alt="Before"
                          className="h-14 w-20 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="h-14 w-20 rounded-lg bg-surface-hover flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted" />
                        </div>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted shrink-0" />
                      {pair.afterImage ? (
                        <img
                          src={pair.afterImage}
                          alt="After"
                          className="h-14 w-20 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="h-14 w-20 rounded-lg bg-surface-hover flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-muted font-mono">{pair.sortOrder}</span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleToggleActive(pair)}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 transition-colors',
                        pair.isActive
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-red-500 bg-red-50 hover:bg-red-100'
                      )}
                    >
                      {pair.isActive ? (
                        <><CheckCircle className="h-3 w-3" /> Active</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(pair)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingPair(pair)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {pairs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    {isLoading ? 'Loading pairs...' : 'No before/after pairs found'}
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
        title={editingPair ? 'Edit Before / After' : 'Add Before / After'}
        size="lg"
      >
        <div className="space-y-4">
          <TranslationTabs locale={formLocale} onChange={setFormLocale} />
          <Input
            label={formLocale === 'en' ? 'Title (optional)' : 'Title (optional, Amharic)'}
            value={getFormValue('title', formTitle)}
            onChange={(e) => setFormValue('title', e.target.value)}
            placeholder="Kitchen Renovation"
          />
          <Input
            label="Sort Order"
            type="number"
            value={String(formSortOrder)}
            onChange={(e) => setFormSortOrder(Number(e.target.value))}
            placeholder="0"
          />

          {/* Image Upload Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Before Image */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Before Image {!editingPair && '*'}
              </label>
              {beforeImagePreview ? (
                <div className="relative">
                  <img
                    src={beforeImagePreview}
                    alt="Before preview"
                    className="w-full h-40 rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={() => { setFormBeforeImage(null); setBeforeImagePreview(''); }}
                    className="absolute top-2 right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">BEFORE</span>
                </div>
              ) : (
                <div
                  onClick={() => beforeImageInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-6 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
                >
                  <ImageIcon className="h-8 w-8 text-muted" />
                  <p className="text-xs text-muted text-center">Click to upload before image</p>
                </div>
              )}
              <input
                ref={beforeImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleBeforeImageChange}
                className="hidden"
              />
            </div>

            {/* After Image */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                After Image {!editingPair && '*'}
              </label>
              {afterImagePreview ? (
                <div className="relative">
                  <img
                    src={afterImagePreview}
                    alt="After preview"
                    className="w-full h-40 rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={() => { setFormAfterImage(null); setAfterImagePreview(''); }}
                    className="absolute top-2 right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">AFTER</span>
                </div>
              ) : (
                <div
                  onClick={() => afterImageInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-6 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
                >
                  <ImageIcon className="h-8 w-8 text-muted" />
                  <p className="text-xs text-muted text-center">Click to upload after image</p>
                </div>
              )}
              <input
                ref={afterImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleAfterImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Live Preview */}
          {beforeImagePreview && afterImagePreview && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Preview</label>
              <div className="relative rounded-lg overflow-hidden border border-border">
                <div className="flex">
                  <div className="relative w-1/2">
                    <img src={beforeImagePreview} alt="Before" className="w-full h-32 object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-medium px-1 py-0.5 rounded">BEFORE</span>
                  </div>
                  <div className="relative w-1/2">
                    <img src={afterImagePreview} alt="After" className="w-full h-32 object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-medium px-1 py-0.5 rounded">AFTER</span>
                  </div>
                </div>
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center">
                  <div className="h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-foreground" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="rounded border-border"
            />
            Active (visible on public site)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => { setModalOpen(false); resetForm(); }}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
              loading={isCreating || isUpdating}
            >
              {editingPair ? 'Save Changes' : 'Create Pair'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingPair}
        onClose={() => setDeletingPair(null)}
        onConfirm={handleDelete}
        title="Delete Before / After Pair"
        message={`Are you sure you want to delete "${deletingPair?.title || 'this pair'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </motion.div>
  );
}
