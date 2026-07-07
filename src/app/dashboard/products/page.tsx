'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '@/store/api/productsApi';
import { useGetMaterialsQuery } from '@/store/api/materialsApi';
import { cn, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import { Plus, Pencil, Trash2, Package, Star, Upload, X, Eye, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { WebsiteProduct } from '@/types/api';

const categories = [
  'Furniture',
  'Aluminum Products',
  'Interior Design',
  'Custom Orders',
  'Accessories',
];

export default function ProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data: productsData, isLoading } = useGetProductsQuery({ search: search || undefined, page, limit });
  const { data: materialsData } = useGetMaterialsQuery({});
  const materials = useMemo(() => {
    const data = materialsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [materialsData]);
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const products = useMemo(() => {
    const data = productsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [productsData]);
  const pagination = productsData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WebsiteProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<WebsiteProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const featureImagesInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formMaterialId, setFormMaterialId] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formMainImage, setFormMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [formFeatureImages, setFormFeatureImages] = useState<File[]>([]);
  const [featureImagePreviews, setFeatureImagePreviews] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return products;
    return products.filter((p) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory('');
    setFormMaterialId('');
    setFormIsFeatured(false);
    setFormMainImage(null);
    setMainImagePreview('');
    setFormFeatureImages([]);
    setFeatureImagePreviews([]);
    setEditingProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (product: WebsiteProduct) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description);
    setFormPrice(String(product.price));
    setFormCategory(product.category);
    setFormMaterialId(product.materialId || '');
    setFormIsFeatured(product.isFeatured);
    setFormMainImage(null);
    setMainImagePreview(product.mainImage || '');
    setFormFeatureImages([]);
    setFeatureImagePreviews(product.featureImages || []);
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
    try {
      const payload: Record<string, any> = {
        name: formName,
        description: formDescription,
        price: parseFloat(formPrice) || 0,
        category: formCategory,
        materialId: formMaterialId || undefined,
        isFeatured: formIsFeatured,
      };
      if (formMainImage) payload.mainImage = formMainImage;
      if (formFeatureImages.length > 0) payload.featureImages = formFeatureImages;

      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, data: payload }).unwrap();
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload as any).unwrap();
        toast.success('Product created successfully');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to save product';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      await deleteProduct(deletingProduct.id).unwrap();
      toast.success('Product deleted successfully');
      setDeletingProduct(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete product';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted">{pagination?.total ?? products.length} products</p>
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
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {['all', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === cat ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Product</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Division</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Category</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Price</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Featured</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                        {product.mainImage ? (
                          <img src={product.mainImage} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted truncate max-w-[200px]">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
                      'bg-walnut/10 text-walnut': product.division === 'furniture',
                      'bg-aluminum/10 text-aluminum': product.division === 'aluminum',
                      'bg-brand-gold/10 text-brand-gold': product.division === 'interior_design',
                      'bg-purple-50 text-purple-600': product.division === 'custom_orders',
                      'bg-teal-50 text-teal-600': product.division === 'accessories',
                    })}>
                      {product.division}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-foreground">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-foreground">{formatCurrency(Number(product.price) || 0)}</td>
                  <td className="py-3">
                    {product.isFeatured ? (
                      <Star className="h-4 w-4 text-brand-gold fill-brand-gold" />
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                  <td className="py-3">
                    <Badge variant={product.isActive ? 'success' : 'secondary'} size="sm">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/products/${product.id}`)}
                        className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="rounded-lg p-1.5 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted">
                    {isLoading ? 'Loading products...' : 'No products found'}
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
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <div className="space-y-4">
          <Input
            label="Product Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Custom Teak Wardrobe"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe the product..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (ETB)"
              type="number"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="0"
            />
            <Select
              label="Category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              options={[
                { value: '', label: 'Select category...' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
          <Select
            label="Material (Optional)"
            value={formMaterialId}
            onChange={(e) => setFormMaterialId(e.target.value)}
            options={[
              { value: '', label: 'Select material...' },
              ...materials.map((m) => ({ value: m.id, label: `${m.name}${m.category ? ` (${m.category})` : ''}` })),
            ]}
          />

          {/* Main Image Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Main Image (Cover)</label>
            {mainImagePreview ? (
              <div className="relative inline-block">
                <img src={mainImagePreview} alt="Main preview" className="h-32 w-32 rounded-lg object-cover border border-border" />
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
                  <p className="text-sm text-foreground">Click to upload main image</p>
                  <p className="text-xs text-muted">JPG, PNG, WebP up to 5MB</p>
                </div>
              </div>
            )}
            <input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
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
            <input ref={featureImagesInputRef} type="file" accept="image/*" multiple onChange={handleFeatureImagesChange} className="hidden" />
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
              checked={formIsFeatured}
              onChange={(e) => setFormIsFeatured(e.target.checked)}
              className="rounded border-border"
            />
            Featured product
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }} disabled={isCreating || isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formName || isCreating || isUpdating} loading={isCreating || isUpdating}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />

    </motion.div>
  );
}
