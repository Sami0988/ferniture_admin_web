'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGetEmployeesQuery, useCreateEmployeeMutation, useActivateEmployeeMutation, useDeactivateEmployeeMutation } from '@/store/api/employeesApi';
import { cn, getSpecialtyLabel, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import { UserPlus, CheckCircle, XCircle, LayoutGrid, List, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ApiEmployee, EmployeeSpecialty } from '@/types/api';

const specialtyColors: Record<string, string> = {
  carpenter: 'bg-walnut/10 text-walnut',
  aluminum_fabricator: 'bg-aluminum/10 text-aluminum',
  interior_designer: 'bg-brand-gold/10 text-brand-gold',
  designer: 'bg-brand-gold/10 text-brand-gold',
  installer: 'bg-teal-50 text-teal-600',
  general: 'bg-gray-100 text-gray-600',
};

const specialties: { value: EmployeeSpecialty; label: string }[] = [
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'aluminum_fabricator', label: 'Aluminum Fabricator' },
  { value: 'interior_designer', label: 'Interior Designer' },
  { value: 'installer', label: 'Installer' },
  { value: 'general', label: 'General' },
];

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: employeesData, isLoading } = useGetEmployeesQuery({
    search: search || undefined,
    specialty: specialtyFilter !== 'all' ? specialtyFilter : undefined,
    page,
    limit,
  });
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [activateEmployee] = useActivateEmployeeMutation();
  const [deactivateEmployee] = useDeactivateEmployeeMutation();

  const employees = useMemo(() => {
    const data = employeesData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [employeesData]);
  const pagination = employeesData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, specialtyFilter]);

  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpecialty, setFormSpecialty] = useState<EmployeeSpecialty>('carpenter');

  const handleCreate = async () => {
    if (!formName || !formPhone) {
      toast.error('Name and phone are required');
      return;
    }
    try {
      await createEmployee({
        name: formName,
        phone: formPhone,
        specialty: formSpecialty,
        email: formEmail || undefined,
      }).unwrap();
      toast.success('Employee created successfully');
      setModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to create employee';
      toast.error(message);
    }
  };

  const handleToggleActive = async (emp: ApiEmployee) => {
    try {
      if (emp.isActive) {
        await deactivateEmployee(emp.id).unwrap();
        toast.success(`${emp.fullName} deactivated`);
      } else {
        await activateEmployee(emp.id).unwrap();
        toast.success(`${emp.fullName} activated`);
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update employee';
      toast.error(message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted">{pagination?.total ?? employees.length} team members</p>
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
          <Button onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          <button
            onClick={() => setSpecialtyFilter('all')}
            className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors', specialtyFilter === 'all' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground')}
          >
            All
          </button>
          {specialties.map((s) => (
            <button
              key={s.value}
              onClick={() => setSpecialtyFilter(s.value)}
              className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors', specialtyFilter === s.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground')}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('rounded-md p-1.5 transition-colors', viewMode === 'grid' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground')}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('rounded-md p-1.5 transition-colors', viewMode === 'list' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground')}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-surface-hover" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-surface-hover rounded" />
                        <div className="h-3 w-32 bg-surface-hover rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-surface-hover rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <Card key={emp.id} className="relative">
                  <div className="flex items-start gap-3">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold text-foreground">
                        {emp.fullName?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">{emp.fullName}</h3>
                        {emp.isActive ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                      </div>
                      {emp.email && <p className="text-xs text-muted truncate">{emp.email}</p>}
                      <p className="text-xs text-muted">{emp.phone}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', specialtyColors[emp.specialty] || 'bg-gray-100 text-gray-600')}>
                      {getSpecialtyLabel(emp.specialty)}
                    </span>
                    {emp.idNumber && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-surface-hover text-muted">
                        {emp.idNumber}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant={emp.isActive ? 'outline' : 'secondary'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleActive(emp)}
                    >
                      {emp.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Employee</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Specialty</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Contact</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Joined</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold text-foreground">
                            {emp.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{emp.fullName}</p>
                          {emp.idNumber && <p className="text-xs text-muted font-mono">{emp.idNumber}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', specialtyColors[emp.specialty] || 'bg-gray-100 text-gray-600')}>
                        {getSpecialtyLabel(emp.specialty)}
                      </span>
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-foreground">{emp.phone}</p>
                      {emp.email && <p className="text-xs text-muted">{emp.email}</p>}
                    </td>
                    <td className="py-3 text-sm text-muted">{formatDate(emp.hireDate || emp.createdAt)}</td>
                    <td className="py-3">
                      {emp.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant={emp.isActive ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleActive(emp)}
                      >
                        {emp.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted">
                      {isLoading ? 'Loading employees...' : 'No employees found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Employee">
        <div className="space-y-4">
          <Input label="Full Name *" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
          <Input label="Phone *" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+251 91 123 4567" />
          <Input label="Email (optional)" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@kassahun.com" />
          <Select
            label="Specialty *"
            value={formSpecialty}
            onChange={(e) => setFormSpecialty(e.target.value as EmployeeSpecialty)}
            options={specialties}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={isCreating}>Add Employee</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
