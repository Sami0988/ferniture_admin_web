'use client';

import { useState, useMemo, useRef } from 'react';
import type React from 'react';
import { useRouter } from 'next/navigation';
import { useGetGalleryProjectsQuery, useCreateGalleryProjectMutation, useDeleteGalleryProjectMutation, useToggleGalleryProjectFeaturedMutation } from '@/store/api/galleryProjectApi';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import { Plus, Trash2, Eye, Star, Upload, X, ImageIcon, Image as ImageIconLucide } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GalleryProject } from '@/types/api';

const divisions: { value: string; label: string }[] = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'interior_design', label: 'Interior Design' },
  { value: 'custom_orders', label: 'Custom Orders' },
  { value: 'accessories', label: 'Accessories' },
];

const aspectRatios: Record<string, { w: number; h: number }> = {
  '1:1': { w: 40, h: 40 },
  '4:3': { w: 48, h: 36 },
  '3:4': { w: 36, h: 48 },
  '16:9': { w: 56, h: 32 },
  '9:16': { w: 32, h: 56 },
  '3:2': { w: 48, h: 32 },
  '2:3': { w: 32, h: 48 },
  '21:9': { w: 56, h: 24 },
};

function getAspectStyle(aspect: string): React.CSSProperties {
  const ratio = aspectRatios[aspect];
  if (!ratio) return {};
  return { width: ratio.w, height: ratio.h };
}

export default function GalleryProjectContent() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: galleryData, isLoading } = useGetGalleryProjectsQuery({
    search: search || undefined,
    division: divisionFilter !== 'all' ? divisionFilter : undefined,
    page,
    limit,
  });
  const [createGalleryProject, { isLoading: isCreating }] = useCreateGalleryProjectMutation();
  const [deleteGalleryProject] = useDeleteGalleryProjectMutation();
  const [toggleFeatured] = useToggleGalleryProjectFeaturedMutation();

  const galleryItems = useMemo(() => {
    const data = galleryData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [galleryData]);
  const pagination = galleryData?.pagination;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<GalleryProject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Create form state
  const [formDivision, setFormDivision] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formRoomType, setFormRoomType] = useState('');
  const [formAspect, setFormAspect] = useState('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!formDivision) {
      toast.error('Please select a division');
      return;
    }
    if (!formImage) {
      toast.error('Please upload an image');
      return;
    }
    try {
      await createGalleryProject({
        division: formDivision as any,
        title: formTitle || undefined,
        roomType: formRoomType || undefined,
        aspect: formAspect || undefined,
        image: formImage,
      }).unwrap();
      toast.success('Gallery image added successfully');
      setCreateModalOpen(false);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to create gallery image';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormDivision('');
    setFormTitle('');
    setFormRoomType('');
    setFormAspect('');
    setFormImage(null);
    setImagePreview('');
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      await deleteGalleryProject(deletingItem.id).unwrap();
      toast.success('Gallery image deleted');
      setDeletingItem(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleFeatured = async (item: GalleryProject) => {
    try {
      await toggleFeatured(item.id).unwrap();
      toast.success(item.isFeatured ? 'Removed from featured' : 'Added to featured');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update';
      toast.error(message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gallery Projects</h1>
          <p className="text-sm text-muted">{pagination?.total ?? galleryItems.length} gallery images</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(limit)}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            options={[
              { value: '10', label: '10 per page' },
              { value: '20', label: '20 per page' },
              { value: '50', label: '50 per page' },
            ]}
          />
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Gallery Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search gallery..." />
        </div>
        <Select
          value={divisionFilter}
          onChange={(e) => { setDivisionFilter(e.target.value); setPage(1); }}
          options={[
            { value: 'all', label: 'All Divisions' },
            ...divisions,
          ]}
        />
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-surface-hover rounded-xl animate-pulse" />
          ))}
        </div>
      ) : galleryItems.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <ImageIconLucide className="h-12 w-12 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">No gallery images found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {galleryItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-square">
                <img
                  src={item.imageUrl}
                  alt={item.title || 'Gallery image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleToggleFeatured(item)}
                    className={cn(
                      'rounded-full p-2 transition-colors',
                      item.isFeatured ? 'bg-yellow-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                    )}
                    title={item.isFeatured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <Star className={cn('h-4 w-4', item.isFeatured && 'fill-current')} />
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="rounded-full p-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {item.isFeatured && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{item.title || 'Untitled'}</p>
                {item.roomType && <p className="text-xs text-muted truncate mt-1">{item.roomType}</p>}
                {item.division && (
                  <span className="inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-foreground mt-2 capitalize">
                    {item.division.replace('_', ' ')}
                  </span>
                )}
                <p className="text-[10px] text-muted mt-2">{formatDate(item.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModalOpen} onClose={() => { setCreateModalOpen(false); resetForm(); }} title="Add Gallery Project" size="md">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Division *</label>
            <select
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={formDivision}
              onChange={(e) => setFormDivision(e.target.value)}
            >
              <option value="">Select division...</option>
              {divisions.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Image *</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-40 w-full rounded-lg object-cover border border-border" />
                <button
                  onClick={() => { setFormImage(null); setImagePreview(''); }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-6 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
              >
                <ImageIcon className="h-8 w-8 text-muted" />
                <div className="text-center">
                  <p className="text-sm text-foreground">Click to upload image</p>
                  <p className="text-xs text-muted">JPG, PNG, WebP up to 5MB</p>
                </div>
              </div>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Title</label>
            <input
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Optional title"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Room Type</label>
            <input
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={formRoomType}
              onChange={(e) => setFormRoomType(e.target.value)}
              placeholder="e.g. Living Room, Bedroom..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Aspect</label>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(aspectRatios).map(([value, size]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormAspect(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all',
                    formAspect === value
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-border hover:border-brand-gold/50 hover:bg-surface-hover/50'
                  )}
                >
                  <div
                    className="border border-current rounded"
                    style={{ width: size.w * 0.6, height: size.h * 0.6 }}
                  />
                  <span className="text-[10px] text-muted leading-tight">{value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setCreateModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} loading={isCreating}>Add Gallery Project</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Gallery Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </motion.div>
  );
}
