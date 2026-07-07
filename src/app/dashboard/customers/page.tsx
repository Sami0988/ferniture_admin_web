'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetCustomersQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation } from '@/store/api/customersApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SearchInput from '@/components/ui/SearchInput';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Avatar from '@/components/ui/Avatar';
import { UserPlus, Phone, Mail, MapPin, Pencil, Trash2, Upload, X, Plus, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ApiCustomer, CustomerType } from '@/types/api';

const customerTypes: { value: CustomerType; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
  { value: 'government', label: 'Government' },
  { value: 'bank', label: 'Bank' },
];

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data: customersData, isLoading } = useGetCustomersQuery({
    search: search || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page,
    limit,
  });
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();

  const customers = useMemo(() => {
    const data = customersData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [customersData]);
  const pagination = customersData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ApiCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<ApiCustomer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState<CustomerType>('personal');
  const [formAddress, setFormAddress] = useState('');
  const [formTinNumber, setFormTinNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const resetForm = () => {
    setFormFullName('');
    setFormPhone('');
    setFormEmail('');
    setFormType('personal');
    setFormAddress('');
    setFormTinNumber('');
    setFormNotes('');
    setFormImage(null);
    setImagePreview('');
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (customer: ApiCustomer) => {
    setEditingCustomer(customer);
    setFormFullName(customer.fullName || '');
    setFormPhone(customer.phone || '');
    setFormEmail(customer.email || '');
    setFormType(customer.type || 'personal');
    setFormAddress(customer.address || '');
    setFormTinNumber(customer.tinNumber || '');
    setFormNotes(customer.notes || '');
    setFormImage(null);
    setImagePreview(customer.imageUrl || '');
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formFullName || !formPhone) {
      toast.error('Full name and phone are required');
      return;
    }
    try {
      const payload: any = {
        fullName: formFullName,
        phone: formPhone,
        type: formType,
      };
      if (formEmail) payload.email = formEmail;
      if (formAddress) payload.address = formAddress;
      if (formTinNumber) payload.tinNumber = formTinNumber;
      if (formNotes) payload.notes = formNotes;
      if (formImage) payload.image = formImage;

      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer.id, data: payload }).unwrap();
        toast.success('Customer updated successfully');
      } else {
        await createCustomer(payload).unwrap();
        toast.success('Customer created successfully');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to save customer';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    setDeleteLoading(true);
    try {
      await deleteCustomer(deletingCustomer.id).unwrap();
      toast.success('Customer deleted successfully');
      setDeletingCustomer(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete customer';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted">{pagination?.total ?? customers.length} customers</p>
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
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-md flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone, email, or TIN..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          <button
            onClick={() => setTypeFilter('all')}
            className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors', typeFilter === 'all' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground')}
          >
            All
          </button>
          {customerTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors', typeFilter === t.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Contact</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Type</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">TIN</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Joined</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {customer.imageUrl ? (
                        <img src={customer.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <Avatar name={customer.fullName} size="sm" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{customer.fullName}</p>
                        {customer.address && <p className="text-xs text-muted">{customer.address}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-foreground">{customer.email || '—'}</p>
                    <p className="text-xs text-muted">{customer.phone}</p>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-foreground capitalize">
                      {customer.type}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-muted font-mono">{customer.tinNumber || '—'}</td>
                  <td className="py-3 text-sm text-muted">{formatDate(customer.createdAt)}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                        className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/projects?customerId=${customer.id}`)}
                        className="rounded-lg p-1.5 text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors"
                        title="Add Work Order"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(customer)}
                        className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    {isLoading ? 'Loading customers...' : 'No customers found'}
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
        title={editingCustomer ? 'Edit Customer' : 'New Customer'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Image Upload */}
          <div className="flex items-center gap-4">
            <div
              className="h-20 w-20 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-gold transition-colors"
              onClick={() => imageInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-6 w-6 text-muted" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted">Click to upload (optional)</p>
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name *" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="John Doe" />
            <Input label="Phone *" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+251 91 123 4567" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@example.com" />
            <Select
              label="Type"
              value={formType}
              onChange={(e) => setFormType(e.target.value as CustomerType)}
              options={customerTypes}
            />
          </div>
          <Input label="Address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Bole, Addis Ababa" />
          <Input label="TIN Number" value={formTinNumber} onChange={(e) => setFormTinNumber(e.target.value)} placeholder="0012345678" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Notes</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Internal notes..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} loading={isCreating || isUpdating}>
              {editingCustomer ? 'Update' : 'Create'} Customer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deletingCustomer?.fullName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </motion.div>
  );
}
