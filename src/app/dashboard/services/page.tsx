'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  useGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} from '@/store/api/servicesApi';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ImageIcon,
  Upload,
  X,
  GripVertical,
  List,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Service } from '@/types/api';

const serviceCategories = [
  { value: 'CUSTOM', label: 'Custom', color: 'bg-walnut/10 text-walnut' },
  { value: 'ALUMINUM', label: 'Aluminum', color: 'bg-aluminum/10 text-aluminum' },
  { value: 'INTERIOR', label: 'Interior', color: 'bg-brand-gold/10 text-brand-gold' },
  { value: 'FURNITURE', label: 'Furniture', color: 'bg-gray-800/10 text-gray-800' },
  { value: 'GENERAL', label: 'General', color: 'bg-blue-50 text-blue-600' },
];

const categoryColorMap: Record<string, string> = Object.fromEntries(
  serviceCategories.map((c) => [c.value, c.color])
);

export default function ServicesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: servicesData, isLoading } = useGetServicesQuery({
    page,
    limit,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: search || undefined,
  });
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

  const allServices = useMemo(() => {
    const data = servicesData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [servicesData]);

  const services = useMemo(() => {
    let filtered = allServices;
    if (activeFilter === 'active') filtered = filtered.filter((s) => s.isActive);
    if (activeFilter === 'inactive') filtered = filtered.filter((s) => !s.isActive);
    return filtered;
  }, [allServices, activeFilter]);

  const pagination = servicesData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, activeFilter]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('CUSTOM');
  const [formDescription, setFormDescription] = useState('');
  const [formBulletPoints, setFormBulletPoints] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  // Image refs
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const featureImagesInputRef = useRef<HTMLInputElement>(null);

  // Image state
  const [formMainImage, setFormMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [formFeatureImages, setFormFeatureImages] = useState<File[]>([]);
  const [featureImagePreviews, setFeatureImagePreviews] = useState<string[]>([]);

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('CUSTOM');
    setFormDescription('');
    setFormBulletPoints('');
    setFormSortOrder(0);
    setFormIsActive(true);
    setFormMainImage(null);
    setMainImagePreview('');
    setFormFeatureImages([]);
    setFeatureImagePreviews([]);
    setEditingService(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormTitle(service.title);
    setFormCategory(service.category);
    setFormDescription(service.description);
    setFormBulletPoints(service.bulletPoints?.join('\n') || '');
    setFormSortOrder(service.sortOrder);
    setFormIsActive(service.isActive);
    setFormMainImage(null);
    setMainImagePreview(service.coverImage || '');
    setFormFeatureImages([]);
    setFeatureImagePreviews(service.featureImages || []);
    setModalOpen(true);
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormMainImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setMainImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFeatureImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formFeatureImages.length + files.length > 5) {
      toast.error('Maximum 5 feature images allowed');
      return;
    }
    setFormFeatureImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFeatureImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFeatureImage = (index: number) => {
    setFormFeatureImages((prev) => prev.filter((_, i) => i !== index));
    setFeatureImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formDescription.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!editingService && !formMainImage) {
      toast.error('Cover image is required');
      return;
    }

    try {
      const bulletPoints = formBulletPoints
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: Record<string, any> = {
        title: formTitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        bulletPoints: bulletPoints.length > 0 ? bulletPoints : undefined,
        sortOrder: formSortOrder,
        isActive: formIsActive,
      };
      if (formMainImage) payload.mainImage = formMainImage;
      if (formFeatureImages.length > 0) payload.featureImages = formFeatureImages;

      if (editingService) {
        await updateService({ id: editingService.id, data: payload }).unwrap();
        toast.success('Service updated successfully');
      } else {
        await createService(payload as any).unwrap();
        toast.success('Service created successfully');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to save service';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    try {
      await deleteService(deletingService.id).unwrap();
      toast.success('Service deleted');
      setDeletingService(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete service';
      toast.error(message);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await updateService({
        id: service.id,
        data: { isActive: !service.isActive },
      }).unwrap();
      toast.success(service.isActive ? 'Service deactivated' : 'Service activated');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update service';
      toast.error(message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted">{pagination?.total ?? services.length} services</p>
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
            Add Service
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search services..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === 'all' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
            )}
          >
            All
          </button>
          {serviceCategories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === c.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {c.label}
            </button>
          ))}
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

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-12">#</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Title</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-28">Category</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-20">Order</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-24">Status</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {services.map((service, idx) => (
                <tr key={service.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 text-sm text-muted font-mono">{(page - 1) * limit + idx + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {service.coverImage ? (
                        <img
                          src={service.coverImage}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                          <ImageIcon className="h-5 w-5 text-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-xs">{service.title}</p>
                        {service.bulletPoints && service.bulletPoints.length > 0 && (
                          <p className="text-xs text-muted">{service.bulletPoints.length} bullet points</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        categoryColorMap[service.category] || 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {serviceCategories.find((c) => c.value === service.category)?.label || service.category}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-muted font-mono">{service.sortOrder}</span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 transition-colors',
                        service.isActive
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-red-500 bg-red-50 hover:bg-red-100'
                      )}
                    >
                      {service.isActive ? (
                        <><CheckCircle className="h-3 w-3" /> Active</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(service)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingService(service)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    {isLoading ? 'Loading services...' : 'No services found'}
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
        title={editingService ? 'Edit Service' : 'Add Service'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Custom Furniture & Woodwork"
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
            <div className="flex gap-1.5 flex-wrap">
              {serviceCategories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormCategory(c.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors',
                    formCategory === c.value
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                      : 'border-border bg-surface text-muted hover:text-foreground'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Handcrafted furniture and woodwork — from dining tables and wardrobes to built-in cabinetry..."
              rows={4}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Bullet Points (one per line)</label>
            <textarea
              value={formBulletPoints}
              onChange={(e) => setFormBulletPoints(e.target.value)}
              placeholder={"Custom furniture design\nBuilt-in cabinetry\nWood paneling & molding\nRestoration & refinishing"}
              rows={4}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-y"
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            value={String(formSortOrder)}
            onChange={(e) => setFormSortOrder(Number(e.target.value))}
            placeholder="0"
          />

          {/* Main Image Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Cover Image {!editingService && '*'}
            </label>
            {mainImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={mainImagePreview}
                  alt="Cover preview"
                  className="h-32 w-48 rounded-lg object-cover border border-border"
                />
                <button
                  onClick={() => { setFormMainImage(null); setMainImagePreview(''); }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => mainImageInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-6 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
              >
                <ImageIcon className="h-8 w-8 text-muted" />
                <div className="text-center">
                  <p className="text-sm text-foreground">Click to upload cover image</p>
                  <p className="text-xs text-muted">JPG, PNG, WebP up to 10MB</p>
                </div>
              </div>
            )}
            <input
              ref={mainImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
              className="hidden"
            />
          </div>

          {/* Feature Images Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Feature Images (Up to 5)</label>
            <div
              onClick={() => featureImagesInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-4 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
            >
              <Upload className="h-6 w-6 text-muted" />
              <p className="text-xs text-muted">Click to upload feature images</p>
            </div>
            <input
              ref={featureImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFeatureImagesChange}
              className="hidden"
            />
          </div>

          {/* Feature Image Previews */}
          {featureImagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {featureImagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Feature ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={() => removeFeatureImage(index)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
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
              disabled={!formTitle.trim() || !formDescription.trim() || isCreating || isUpdating}
              loading={isCreating || isUpdating}
            >
              {editingService ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${deletingService?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </motion.div>
  );
}
