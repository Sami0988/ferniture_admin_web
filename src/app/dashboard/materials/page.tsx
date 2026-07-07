'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMaterialsQuery, useCreateMaterialMutation, useUpdateMaterialMutation, useDeleteMaterialMutation } from '@/store/api/materialsApi';
import { cn, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import { Plus, Pencil, Trash2, Eye, Palette, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ApiMaterial, MaterialCategory } from '@/types/api';

const materialCategories: { value: MaterialCategory; label: string }[] = [
  { value: 'wood_species', label: 'Wood Species' },
  { value: 'wood_finish', label: 'Wood Finish' },
  { value: 'aluminum_profile', label: 'Aluminum Profile' },
  { value: 'aluminum_color', label: 'Aluminum Color' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'glass', label: 'Glass' },
  { value: 'other', label: 'Other' },
];

const units = [
  { value: 'board_ft', label: 'Board Ft' },
  { value: 'sq_ft', label: 'Sq Ft' },
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kg' },
  { value: 'meter', label: 'Meter' },
  { value: 'roll', label: 'Roll' },
];

const categoryColors: Record<string, string> = {
  wood_species: 'bg-walnut/10 text-walnut',
  wood_finish: 'bg-walnut/10 text-walnut',
  aluminum_profile: 'bg-aluminum/10 text-aluminum',
  aluminum_color: 'bg-aluminum/10 text-aluminum',
  hardware: 'bg-gray-100 text-gray-600',
  glass: 'bg-blue-50 text-blue-600',
  other: 'bg-surface-hover text-foreground',
};

export default function MaterialsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data: materialsData, isLoading } = useGetMaterialsQuery({
    search: search || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    page,
    limit,
  });
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();
  const [deleteMaterial] = useDeleteMaterialMutation();

  const materials = useMemo(() => {
    const data = materialsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [materialsData]);
  const pagination = materialsData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ApiMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<ApiMaterial | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const swatchInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MaterialCategory>('wood_species');
  const [formDescription, setFormDescription] = useState('');
  const [formUnitCost, setFormUnitCost] = useState('');
  const [formUnit, setFormUnit] = useState('piece');
  const [formSupplier, setFormSupplier] = useState('');
  const [formIsPublicVisible, setFormIsPublicVisible] = useState(false);
  const [formSwatchImage, setFormSwatchImage] = useState<File | null>(null);
  const [swatchPreview, setSwatchPreview] = useState('');
  const [formImages, setFormImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

  const resetForm = () => {
    setFormName('');
    setFormCategory('wood_species');
    setFormDescription('');
    setFormUnitCost('');
    setFormUnit('piece');
    setFormSupplier('');
    setFormIsPublicVisible(false);
    setFormSwatchImage(null);
    setSwatchPreview('');
    setFormImages([]);
    setImagesPreviews([]);
    setEditingMaterial(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (material: ApiMaterial) => {
    setEditingMaterial(material);
    setFormName(material.name);
    setFormCategory(material.category);
    setFormDescription(material.description || '');
    setFormUnitCost(String(material.unitCost || ''));
    setFormUnit(material.unit || 'piece');
    setFormSupplier(material.supplier || '');
    setFormIsPublicVisible(material.isPublicVisible);
    setFormSwatchImage(null);
    setSwatchPreview(material.swatchImageUrl || '');
    setFormImages([]);
    setImagesPreviews(material.images || []);
    setModalOpen(true);
  };

  const handleSwatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormSwatchImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSwatchPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setFormImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagesPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
    setImagesPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const payload: Record<string, any> = {
        name: formName,
        category: formCategory,
        description: formDescription || undefined,
        unitCost: parseFloat(formUnitCost) || 0,
        unit: formUnit,
        supplier: formSupplier || undefined,
        isPublicVisible: formIsPublicVisible,
      };
      if (formSwatchImage) payload.swatchImage = formSwatchImage;
      if (formImages.length > 0) payload.images = formImages;

      if (editingMaterial) {
        await updateMaterial({ id: editingMaterial.id, data: payload }).unwrap();
        toast.success('Material updated successfully');
      } else {
        await createMaterial(payload as any).unwrap();
        toast.success('Material created successfully');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to save material';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingMaterial) return;
    setDeleteLoading(true);
    try {
      await deleteMaterial(deletingMaterial.id).unwrap();
      toast.success('Material deleted successfully');
      setDeletingMaterial(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete material';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materials</h1>
          <p className="text-sm text-muted">{pagination?.total ?? materials.length} materials</p>
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
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search materials..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === 'all' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
            )}
          >
            All
          </button>
          {materialCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === cat.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Material</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Category</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Unit Cost</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Unit</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Supplier</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {material.swatchImageUrl ? (
                        <img src={material.swatchImageUrl} alt={material.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-surface-hover flex items-center justify-center">
                          <Palette className="h-5 w-5 text-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{material.name}</p>
                        {material.description && (
                          <p className="text-xs text-muted truncate max-w-[200px]">{material.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', categoryColors[material.category] || 'bg-surface-hover text-foreground')}>
                      {materialCategories.find((c) => c.value === material.category)?.label || material.category}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-foreground">{formatCurrency(material.unitCost || 0)}</td>
                  <td className="py-3 text-sm text-muted capitalize">{material.unit}</td>
                  <td className="py-3 text-sm text-muted">{material.supplier || '-'}</td>
                  <td className="py-3">
                    <Badge variant={material.isActive ? 'success' : 'secondary'} size="sm">
                      {material.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/materials/${material.id}`)}
                        className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(material)}
                        className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingMaterial(material)}
                        className="rounded-lg p-1.5 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted">
                    {isLoading ? 'Loading materials...' : 'No materials found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.page || pagination.page <= 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(pagination.totalPages || 1, 5) }, (_, i) => {
              let pageNum: number;
              if ((pagination.totalPages || 1) <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= (pagination.totalPages || 1) - 2) {
                pageNum = (pagination.totalPages || 1) - 4 + i;
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
              onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
              disabled={!pagination.page || pagination.page >= (pagination.totalPages || 1)}
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
        title={editingMaterial ? 'Edit Material' : 'Add Material'}
      >
        <div className="space-y-4">
          <Input
            label="Material Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Ethiopian Mahogany"
          />
          <Select
            label="Category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as MaterialCategory)}
            options={materialCategories.map((c) => ({ value: c.value, label: c.label }))}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe the material..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Cost (ETB)"
              type="number"
              value={formUnitCost}
              onChange={(e) => setFormUnitCost(e.target.value)}
              placeholder="0"
            />
            <Select
              label="Unit"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              options={units}
            />
          </div>
          <Input
            label="Supplier"
            value={formSupplier}
            onChange={(e) => setFormSupplier(e.target.value)}
            placeholder="Supplier name"
          />

          {/* Swatch Image Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Swatch Image</label>
            {swatchPreview ? (
              <div className="relative inline-block">
                <img src={swatchPreview} alt="Swatch preview" className="h-24 w-24 rounded-lg object-cover border border-border" />
                <button
                  onClick={() => { setFormSwatchImage(null); setSwatchPreview(''); }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => swatchInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-4 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
              >
                <Palette className="h-6 w-6 text-muted" />
                <p className="text-xs text-muted">Click to upload swatch image</p>
              </div>
            )}
            <input ref={swatchInputRef} type="file" accept="image/*" onChange={handleSwatchChange} className="hidden" />
          </div>

          {/* Material Images Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Material Images (Up to 5)</label>
            <div
              onClick={() => imagesInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-4 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
            >
              <Upload className="h-6 w-6 text-muted" />
              <p className="text-xs text-muted">Click to upload material images</p>
            </div>
            <input ref={imagesInputRef} type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
          </div>

          {/* Images Previews */}
          {imagesPreviews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imagesPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Image ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={() => removeImage(index)}
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
              checked={formIsPublicVisible}
              onChange={(e) => setFormIsPublicVisible(e.target.checked)}
              className="rounded border-border"
            />
            Publicly visible
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }} disabled={isCreating || isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formName || isCreating || isUpdating} loading={isCreating || isUpdating}>
              {editingMaterial ? 'Save Changes' : 'Create Material'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingMaterial}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        message={`Are you sure you want to delete "${deletingMaterial?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </motion.div>
  );
}
