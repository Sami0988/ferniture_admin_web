'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetPurchasesQuery, useLazyGetPurchaseByIdQuery, useCreatePurchaseMutation, useUpdatePurchaseMutation, useDeletePurchaseMutation } from '@/store/api/purchasesApi';
import { usePermission } from '@/hooks/usePermission';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { purchaseFormSchema, PurchaseFormData } from '@/lib/validations';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import SupplierSelect from '@/components/purchases/SupplierSelect';
import { Plus, Pencil, Trash2, Eye, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ApiPurchase, CreatePurchaseItemInput } from '@/types/api';

interface SupplierOption {
  id: string;
  companyName: string;
  tinNumber: string;
  phone: string | null;
  address: string | null;
}

function extractFieldErrors(err: any): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  const errorsArray = err?.data?.errors;
  if (Array.isArray(errorsArray)) {
    for (const e of errorsArray) {
      if (e.field && e.message) {
        fieldErrors[e.field] = e.message;
      }
    }
  }
  return fieldErrors;
}

function getSafeErrorMessage(err: any, fallback: string): string {
  const msg = err?.data?.message || err?.message;
  if (typeof msg === 'string' && msg.length > 0 && msg.length < 500) return msg;
  return fallback;
}

export default function PurchaseRecordsPage() {
  const router = useRouter();
  const { canDelete } = usePermission();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSupplier, setFilterSupplier] = useState<SupplierOption | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = Number(sp.get('page')) || 1;
    const l = Number(sp.get('limit')) || 20;
    setPage(p);
    setLimit(l);
    setFilterSupplierId(sp.get('supplierId') || '');
    setFilterFrom(sp.get('from') || '');
    setFilterTo(sp.get('to') || '');
    setParamsLoaded(true);
  }, []);

  const { data: purchasesData, isLoading } = useGetPurchasesQuery({
    page,
    limit,
    supplierId: filterSupplierId || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
  }, { skip: !paramsLoaded });
  const [createPurchase, { isLoading: isCreating }] = useCreatePurchaseMutation();
  const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchaseMutation();
  const [deletePurchase] = useDeletePurchaseMutation();
  const [getPurchaseById] = useLazyGetPurchaseByIdQuery();

  const purchases = useMemo(() => {
    const data = purchasesData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [purchasesData]);
  const pagination = purchasesData?.pagination;

  useEffect(() => { setPage(1); }, [filterSupplierId, filterFrom, filterTo]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (limit !== 20) params.set('limit', String(limit));
    if (filterSupplierId) params.set('supplierId', filterSupplierId);
    if (filterFrom) params.set('from', filterFrom);
    if (filterTo) params.set('to', filterTo);
    const qs = params.toString();
    router.replace(`/dashboard/purchases/records${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [page, limit, filterSupplierId, filterFrom, filterTo, router]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<ApiPurchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<ApiPurchase | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formSupplier, setFormSupplier] = useState<SupplierOption | null>(null);
  const [formItems, setFormItems] = useState<CreatePurchaseItemInput[]>([{ materialName: '', quantity: 1, unitPrice: 0 }]);
  const [formItemsError, setFormItemsError] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: '',
      fsNumber: '',
      bankTransactionNumber: '',
      purchaseDate: '',
      items: [],
    },
  });

  const resetForm = () => {
    setFormSupplier(null);
    setFormItems([{ materialName: '', quantity: 1, unitPrice: 0 }]);
    setFormItemsError('');
    reset({ supplierId: '', fsNumber: '', bankTransactionNumber: '', purchaseDate: '', items: [] });
  };

  useEffect(() => {
    setValue('supplierId', formSupplier?.id || '');
  }, [formSupplier, setValue]);

  useEffect(() => {
    const validItems = formItems.filter((i) => i.materialName && i.quantity > 0 && i.unitPrice > 0);
    if (validItems.length > 0) {
      setValue('items', validItems);
    }
  }, [formItems, setValue]);

  const openCreateModal = () => {
    setEditingPurchase(null);
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = async (purchase: ApiPurchase) => {
    setEditingPurchase(purchase);
    setFormSupplier({ id: purchase.supplierId, companyName: purchase.supplierName, tinNumber: '', phone: null, address: null });
    setModalOpen(true);

    try {
      const result = await getPurchaseById(purchase.id).unwrap();
      const detail = result?.data;
      const items = detail?.items?.map((item) => ({
        materialName: item.materialName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })) || [];
      setFormItems(items.length > 0 ? items : [{ materialName: '', quantity: 1, unitPrice: 0 }]);
      reset({
        supplierId: purchase.supplierId,
        fsNumber: purchase.fsNumber || '',
        bankTransactionNumber: purchase.bankTransactionNumber || '',
        purchaseDate: purchase.purchaseDate ? purchase.purchaseDate.split('T')[0] : '',
        items,
      });
    } catch {
      setFormItems([{ materialName: '', quantity: 1, unitPrice: 0 }]);
    }
  };

  const addItem = () => {
    setFormItems([...formItems, { materialName: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CreatePurchaseItemInput, value: string | number) => {
    const updated = [...formItems];
    if (field === 'materialName') {
      updated[index] = { ...updated[index], materialName: value as string };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    }
    setFormItems(updated);
  };

  const lineTotal = (item: CreatePurchaseItemInput) => item.quantity * item.unitPrice;
  const sumBeforeVat = formItems.reduce((sum, item) => sum + lineTotal(item), 0);
  const estVat = sumBeforeVat * 0.15;
  const estWithholding = sumBeforeVat > 10000 ? sumBeforeVat * 0.03 : 0;
  const estTotal = sumBeforeVat + estVat - estWithholding;

  const onSubmit = async (data: PurchaseFormData) => {
    if (!formSupplier) {
      toast.error('Supplier is required');
      return;
    }

    const validItems = formItems.filter((i) => i.materialName && i.quantity > 0 && i.unitPrice > 0);
    if (validItems.length === 0) {
      setFormItemsError('At least one item with material name, quantity > 0, and unit price > 0 is required');
      return;
    }
    setFormItemsError('');

    try {
      const payload: any = {
        supplierId: formSupplier.id,
        fsNumber: data.fsNumber,
        purchaseDate: data.purchaseDate,
        bankTransactionNumber: data.bankTransactionNumber || null,
        items: validItems,
      };

      if (editingPurchase) {
        await updatePurchase({ id: editingPurchase.id, data: payload }).unwrap();
        toast.success('Purchase updated successfully');
      } else {
        await createPurchase(payload).unwrap();
        toast.success('Purchase created successfully');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const status = err?.status || err?.data?.statusCode;
      if (status === 404) {
        toast.error('Supplier not found. It may have been deleted. Refreshing supplier list...');
        return;
      }
      const message = getSafeErrorMessage(err, 'Failed to save purchase');
      const fieldErrors = extractFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        toast.error(Object.values(fieldErrors).join('. '));
      } else {
        toast.error(message);
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingPurchase) return;
    setDeleteLoading(true);
    try {
      await deletePurchase(deletingPurchase.id).unwrap();
      toast.success('Purchase deleted successfully');
      setDeletingPurchase(null);
    } catch (err: any) {
      toast.error(getSafeErrorMessage(err, 'Failed to delete purchase'));
      setDeletingPurchase(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterSupplierId('');
    setFilterFrom('');
    setFilterTo('');
    setFilterSupplier(null);
  };

  const hasActiveFilters = filterSupplierId || filterFrom || filterTo;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Records</h1>
          <p className="text-sm text-muted">{pagination?.total ?? purchases.length} purchases</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground">
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <Button onClick={openCreateModal}><Plus className="h-4 w-4" /> New Purchase</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted mb-1">From</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted mb-1">To</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
        </div>
        <div className="flex-1 min-w-[250px]">
          <SupplierSelect
            value={filterSupplier}
            onChange={(supplier) => {
              setFilterSupplier(supplier);
              setFilterSupplierId(supplier?.id || '');
            }}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Supplier</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">FS Number</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Before VAT</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">VAT</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Withholding</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Total</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 text-sm text-muted">{formatDate(purchase.purchaseDate)}</td>
                    <td className="py-3 text-sm font-medium text-foreground">{purchase.supplierName}</td>
                    <td className="py-3 text-sm text-muted font-mono">{purchase.fsNumber}</td>
                    <td className="py-3 text-sm text-right">{formatCurrency(purchase.amountBeforeVat)}</td>
                    <td className="py-3 text-sm text-right">{formatCurrency(purchase.vatAmount)}</td>
                    <td className="py-3 text-sm text-right">{formatCurrency(purchase.withholdingAmount)}</td>
                    <td className="py-3 text-sm text-right font-medium">{formatCurrency(purchase.totalAmount)}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/dashboard/purchases/records/${purchase.id}`)} className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEditModal(purchase)} className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {canDelete ? (
                          <button onClick={() => setDeletingPurchase(purchase)} className="rounded-lg p-1.5 text-muted hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="rounded-lg p-1.5 text-muted/40 cursor-not-allowed" title="Only an admin can delete this">
                            <Trash2 className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-muted">
                      {hasActiveFilters ? (
                        <p>No purchases match the current filters</p>
                      ) : (
                        <div className="space-y-3">
                          <p>No purchases yet — record your first purchase</p>
                          <Button size="sm" onClick={openCreateModal}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            New Purchase
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.page || pagination.page <= 1}>Previous</Button>
            {Array.from({ length: Math.min(pagination.totalPages || 1, 5) }, (_, i) => {
              let pageNum: number;
              if ((pagination.totalPages || 1) <= 5) pageNum = i + 1;
              else if (pagination.page <= 3) pageNum = i + 1;
              else if (pagination.page >= (pagination.totalPages || 1) - 2) pageNum = (pagination.totalPages || 1) - 4 + i;
              else pageNum = pagination.page - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)} className={cn('h-8 w-8 rounded-lg text-sm font-medium transition-colors', pagination.page === pageNum ? 'bg-brand-gold text-white' : 'text-muted hover:bg-surface-hover')}>
                  {pageNum}
                </button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))} disabled={!pagination.page || pagination.page >= (pagination.totalPages || 1)}>Next</Button>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingPurchase ? 'Edit Purchase' : 'New Purchase'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SupplierSelect value={formSupplier} onChange={setFormSupplier} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">FS Number *</label>
              <input
                {...register('fsNumber')}
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                placeholder="FS-001"
              />
              {errors.fsNumber && <p className="text-xs text-red-500">{errors.fsNumber.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Bank Transaction #</label>
              <input
                {...register('bankTransactionNumber')}
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                placeholder="Optional"
              />
              {errors.bankTransactionNumber && <p className="text-xs text-red-500">{errors.bankTransactionNumber.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Purchase Date *</label>
            <input
              type="date"
              {...register('purchaseDate')}
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
            />
            {errors.purchaseDate && <p className="text-xs text-red-500">{errors.purchaseDate.message}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Items *</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3" /> Add Item</Button>
            </div>
            {formItems.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3 space-y-2 sm:border-0 sm:p-0 sm:space-y-0">
                <div className="sm:flex sm:items-end sm:gap-2 sm:space-y-0 space-y-2">
                  <div className="flex-1">
                    {idx === 0 && <label className="block text-xs text-muted mb-1 sm:hidden">Material Name</label>}
                    <label className="hidden sm:block text-xs text-muted mb-1">Material Name</label>
                    <input type="text" value={item.materialName} onChange={(e) => updateItem(idx, 'materialName', e.target.value)} placeholder="e.g. Oak Wood Plank" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div className="w-full sm:w-24">
                    {idx === 0 && <label className="block text-xs text-muted mb-1 sm:hidden">Qty</label>}
                    <label className="hidden sm:block text-xs text-muted mb-1">Qty</label>
                    <input type="number" min={0.01} step="any" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div className="w-full sm:w-32">
                    {idx === 0 && <label className="block text-xs text-muted mb-1 sm:hidden">Unit Price</label>}
                    <label className="hidden sm:block text-xs text-muted mb-1">Unit Price</label>
                    <input type="number" min={0} step={0.01} value={item.unitPrice || ''} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div className="w-full sm:w-28 sm:text-right">
                    {idx === 0 && <label className="block text-xs text-muted mb-1 sm:hidden">Total</label>}
                    <label className="hidden sm:block text-xs text-muted mb-1">Total</label>
                    <span className="inline-block py-2 text-sm text-foreground font-medium">{formatCurrency(lineTotal(item))}</span>
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} disabled={formItems.length <= 1} className="rounded-lg p-2 text-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed sm:shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {formItemsError && <p className="text-xs text-red-500">{formItemsError}</p>}
          </div>

          <div className="rounded-lg bg-surface-hover/50 p-4 space-y-2">
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Estimated Summary (preview only)</p>
            <div className="flex justify-between text-sm"><span className="text-muted">Amount Before VAT</span><span className="font-medium">{formatCurrency(sumBeforeVat)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Est. VAT (15%)</span><span className="font-medium">{formatCurrency(estVat)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Est. Withholding (3%)</span><span className="font-medium">{formatCurrency(estWithholding)}</span></div>
            <div className="flex justify-between text-sm border-t border-border pt-2"><span className="text-foreground font-medium">Est. Total</span><span className="font-bold">{formatCurrency(estTotal)}</span></div>
            <p className="text-[10px] text-muted italic">Final values are calculated on the server</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" loading={isCreating || isUpdating}>{editingPurchase ? 'Update' : 'Create'} Purchase</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingPurchase}
        onClose={() => setDeletingPurchase(null)}
        onConfirm={handleDelete}
        title="Delete Purchase"
        message={`Are you sure you want to delete purchase "${deletingPurchase?.fsNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </motion.div>
  );
}
