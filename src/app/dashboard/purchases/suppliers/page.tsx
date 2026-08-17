'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetSuppliersQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation } from '@/store/api/suppliersApi';
import { usePermission } from '@/hooks/usePermission';
import { cn, formatDate } from '@/lib/utils';
import { supplierFormSchema, SupplierFormData } from '@/lib/validations';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ApiSupplier } from '@/types/api';

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

export default function SuppliersPage() {
  const { canDelete } = usePermission();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data: suppliersData, isLoading } = useGetSuppliersQuery({ search: search || undefined, page, limit });
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();

  const suppliers = useMemo(() => {
    const data = suppliersData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [suppliersData]);
  const pagination = suppliersData?.pagination;

  useEffect(() => { setPage(1); }, [search]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ApiSupplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<ApiSupplier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { register, handleSubmit, reset, formState: { errors }, setError } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      companyName: '',
      tinNumber: '',
      bankAccountNumber: '',
      phone: '',
      address: '',
    },
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    reset({ companyName: '', tinNumber: '', bankAccountNumber: '', phone: '', address: '' });
    setModalOpen(true);
  };

  const openEditModal = (supplier: ApiSupplier) => {
    setEditingSupplier(supplier);
    reset({
      companyName: supplier.companyName || '',
      tinNumber: supplier.tinNumber || '',
      bankAccountNumber: supplier.bankAccountNumber || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: SupplierFormData) => {
    try {
      const payload: any = {
        companyName: data.companyName,
        tinNumber: data.tinNumber,
      };
      if (data.bankAccountNumber) payload.bankAccountNumber = data.bankAccountNumber;
      if (data.phone) payload.phone = data.phone;
      if (data.address) payload.address = data.address;

      if (editingSupplier) {
        await updateSupplier({ id: editingSupplier.id, data: payload }).unwrap();
        toast.success('Supplier updated successfully');
      } else {
        await createSupplier(payload).unwrap();
        toast.success('Supplier created successfully');
      }
      setModalOpen(false);
      reset();
    } catch (err: any) {
      const message = getSafeErrorMessage(err, 'Failed to save supplier');
      const fieldErrors = extractFieldErrors(err);

      if (fieldErrors.tinNumber || (message.toLowerCase().includes('tin') && message.toLowerCase().includes('already exists'))) {
        setError('tinNumber', { message: fieldErrors.tinNumber || 'A supplier with this TIN already exists' });
      } else if (Object.keys(fieldErrors).length > 0) {
        for (const [field, msg] of Object.entries(fieldErrors)) {
          if (field in { companyName: 1, tinNumber: 1, bankAccountNumber: 1, phone: 1, address: 1 }) {
            setError(field as keyof SupplierFormData, { message: msg });
          }
        }
      } else {
        toast.error(message);
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteSupplier(deletingSupplier.id).unwrap();
      toast.success('Supplier deleted successfully');
      setDeletingSupplier(null);
    } catch (err: any) {
      const status = err?.status || err?.data?.statusCode;
      if (status === 409) {
        setDeleteError(getSafeErrorMessage(err, 'Cannot delete this supplier'));
        setDeleteLoading(false);
        return;
      }
      toast.error(getSafeErrorMessage(err, 'Failed to delete supplier'));
      setDeletingSupplier(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-sm text-muted">{pagination?.total ?? suppliers.length} suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <Button onClick={openCreateModal}>
            <UserPlus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-md flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by company name, TIN, or phone..." />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Company</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">TIN</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Phone</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Bank Account</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Address</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <p className="text-sm font-medium text-foreground">{supplier.companyName}</p>
                    </td>
                    <td className="py-3 text-sm text-muted font-mono">{supplier.tinNumber}</td>
                    <td className="py-3 text-sm text-muted">{supplier.phone || '—'}</td>
                    <td className="py-3 text-sm text-muted font-mono">{supplier.bankAccountNumber || '—'}</td>
                    <td className="py-3 text-sm text-muted max-w-[200px] truncate">{supplier.address || '—'}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {canDelete ? (
                          <button
                            onClick={() => { setDeletingSupplier(supplier); setDeleteError(''); }}
                            className="rounded-lg p-1.5 text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span
                            className="rounded-lg p-1.5 text-muted/40 cursor-not-allowed"
                            title="Only an admin can delete this"
                          >
                            <Trash2 className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted">
                      {search ? (
                        <p>No suppliers match &quot;{search}&quot;</p>
                      ) : (
                        <div className="space-y-3">
                          <p>No suppliers yet — add your first supplier</p>
                          <Button size="sm" onClick={openCreateModal}>
                            <UserPlus className="h-4 w-4 mr-1.5" />
                            Add Supplier
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
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.page || pagination.page <= 1}>
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
                    pagination.page === pageNum ? 'bg-brand-gold text-white' : 'text-muted hover:bg-surface-hover'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))} disabled={!pagination.page || pagination.page >= (pagination.totalPages || 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title={editingSupplier ? 'Edit Supplier' : 'New Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Company Name *</label>
            <input
              {...register('companyName')}
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              placeholder="Acme Supplies PLC"
            />
            {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">TIN Number *</label>
            <input
              {...register('tinNumber')}
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              placeholder="0012345678"
              maxLength={10}
            />
            {errors.tinNumber && <p className="text-xs text-red-500">{errors.tinNumber.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Bank Account Number</label>
            <input
              {...register('bankAccountNumber')}
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              placeholder="Optional"
            />
            {errors.bankAccountNumber && <p className="text-xs text-red-500">{errors.bankAccountNumber.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Phone</label>
            <input
              {...register('phone')}
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              placeholder="+251 91 123 4567"
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Address</label>
            <textarea
              {...register('address')}
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              placeholder="Bole, Addis Ababa"
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isCreating || isUpdating}>
              {editingSupplier ? 'Update' : 'Create'} Supplier
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingSupplier}
        onClose={() => { setDeletingSupplier(null); setDeleteError(''); }}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={deleteError || `Are you sure you want to delete "${deletingSupplier?.companyName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </motion.div>
  );
}
