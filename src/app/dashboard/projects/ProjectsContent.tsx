'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetProjectsQuery, useCreateProjectMutation, useUpdateProjectStatusMutation, useDeleteProjectMutation } from '@/store/api/projectsApi';
import { useGetCustomersQuery, useCreateCustomerMutation } from '@/store/api/customersApi';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import StatusPill from '@/components/ui/StatusPill';
import DivisionBadge from '@/components/ui/DivisionBadge';
import { Plus, Pencil, Trash2, Eye, LayoutGrid, List, Calendar, User, GripVertical, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ApiProject, ProjectStatus, ProjectDivision, ProjectPriority, CustomerType } from '@/types/api';

const statusColumns: { status: ProjectStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New', color: 'bg-status-new' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-status-progress' },
  { status: 'completed', label: 'Completed', color: 'bg-status-completed' },
  { status: 'delivered', label: 'Delivered', color: 'bg-status-delivered' },
  { status: 'paid', label: 'Paid', color: 'bg-status-paid' },
  { status: 'cancelled', label: 'Cancelled', color: 'bg-gray-400' },
];

const divisions: { value: ProjectDivision; label: string }[] = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'interior_design', label: 'Interior Design' },
  { value: 'custom_orders', label: 'Custom Orders' },
  { value: 'accessories', label: 'Accessories' },
];

export default function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [divisionFilter, setDivisionFilter] = useState<ProjectDivision | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const { data: projectsData, isLoading } = useGetProjectsQuery({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    division: divisionFilter !== 'all' ? divisionFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    page,
    limit,
  });
  const { data: customersData } = useGetCustomersQuery({});
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
  const [updateProjectStatus] = useUpdateProjectStatusMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const projects = useMemo(() => {
    const data = projectsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [projectsData]);
  const pagination = projectsData?.pagination;

  const customers = useMemo(() => {
    const data = customersData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [customersData]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, divisionFilter, priorityFilter]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ApiProject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formDivision, setFormDivision] = useState<ProjectDivision>('furniture');
  const [formPriority, setFormPriority] = useState<ProjectPriority>('normal');
  const [formOrderDate, setFormOrderDate] = useState('');
  const [formDeliveryDate, setFormDeliveryDate] = useState('');

  // New customer form state
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerType, setNewCustomerType] = useState<CustomerType>('personal');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerTin, setNewCustomerTin] = useState('');

  useEffect(() => {
    if (preselectedCustomerId) {
      setFormCustomerId(preselectedCustomerId);
      setCreateModalOpen(true);
    }
  }, [preselectedCustomerId]);

  const handleCreateProject = async () => {
    if (!formTitle || !formOrderDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    let customerId = formCustomerId;

    // Create new customer first if toggled
    if (createNewCustomer) {
      if (!newCustomerName || !newCustomerPhone) {
        toast.error('Customer name and phone are required');
        return;
      }
      try {
        const newCustomer = await createCustomer({
          fullName: newCustomerName,
          phone: newCustomerPhone,
          email: newCustomerEmail || undefined,
          type: newCustomerType,
          address: newCustomerAddress || undefined,
          tinNumber: newCustomerTin || undefined,
        }).unwrap();
        customerId = newCustomer.data.id;
        toast.success('Customer created successfully');
      } catch (err: any) {
        const message = err?.data?.message || err?.message || 'Failed to create customer';
        toast.error(message);
        return;
      }
    }

    if (!customerId) {
      toast.error('Please select or create a customer');
      return;
    }

    try {
      await createProject({
        customerId,
        division: formDivision,
        title: formTitle,
        description: formDescription || undefined,
        orderDate: formOrderDate,
        deliveryDate: formDeliveryDate || undefined,
        priority: formPriority,
      }).unwrap();
      toast.success('Project created successfully');
      setCreateModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormCustomerId('');
      setFormOrderDate('');
      setFormDeliveryDate('');
      setCreateNewCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewCustomerType('personal');
      setNewCustomerAddress('');
      setNewCustomerTin('');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to create project';
      toast.error(message);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      await updateProjectStatus({ id: projectId, data: { status: newStatus } }).unwrap();
      toast.success(`Project status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update status';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    setDeleteLoading(true);
    try {
      await deleteProject(deletingProject.id).unwrap();
      toast.success('Project deleted successfully');
      setDeletingProject(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete project';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted">{pagination?.total ?? projects.length} projects</p>
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
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
          options={[
            { value: 'all', label: 'All Statuses' },
            ...statusColumns.map((s) => ({ value: s.status, label: s.label })),
          ]}
        />
        <Select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value as ProjectDivision | 'all')}
          options={[
            { value: 'all', label: 'All Divisions' },
            ...divisions,
          ]}
        />
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | 'all')}
          options={[
            { value: 'all', label: 'All Priorities' },
            { value: 'normal', label: 'Normal' },
            { value: 'urgent', label: 'Urgent' },
            { value: 'vip', label: 'VIP' },
          ]}
        />
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn('rounded-md p-1.5 transition-colors', viewMode === 'kanban' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground')}
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

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.status);
            return (
              <div key={col.status} className="min-w-[280px] flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('h-2 w-2 rounded-full', col.color)} />
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                  <span className="text-xs text-muted bg-surface-hover rounded-full px-2 py-0.5">{colProjects.length}</span>
                </div>
                <div className="space-y-3 min-h-[100px] rounded-xl border border-border/50 bg-surface-hover/30 p-2">
                  <AnimatePresence>
                    {colProjects.map((project) => (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                        className="rounded-lg border border-border bg-surface p-3 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{project.title}</p>
                        </div>
                        <p className="text-xs text-muted mb-2 line-clamp-2">{project.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <DivisionBadge division={project.division} />
                          <span className="text-[10px] text-muted font-mono">{project.projectNumber}</span>
                          <span className={cn('ml-auto text-[10px] font-medium capitalize', {
                            'text-red-600': project.priority === 'urgent',
                            'text-purple-600': project.priority === 'vip',
                            'text-slate-500': project.priority === 'normal',
                          })}>
                            {project.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Calendar className="h-3 w-3" />
                            {formatDate(project.deliveryDate || '')}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Project</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Division</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Priority</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Order Date</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Delivery Date</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{project.title}</p>
                          <p className="text-xs text-muted font-mono">{project.projectNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><DivisionBadge division={project.division} /></td>
                    <td className="py-3"><StatusPill status={project.status} size="sm" /></td>
                    <td className="py-3">
                      <span className={cn('text-xs font-medium capitalize', {
                        'text-red-600': project.priority === 'urgent',
                        'text-purple-600': project.priority === 'vip',
                        'text-slate-500': project.priority === 'normal',
                      })}>
                        {project.priority}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-muted">{formatDate(project.orderDate || '')}</td>
                    <td className="py-3 text-sm text-muted">{formatDate(project.deliveryDate || '')}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                          className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProject(project)}
                          className="rounded-lg p-1.5 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted">
                      {isLoading ? 'Loading projects...' : 'No projects found'}
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
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="New Project" size="lg">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Project Title *</label>
            <input
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Kitchen Renovation"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe the project scope..."
            />
          </div>
          <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Customer *</label>
              {preselectedCustomerId ? (
                <input
                  type="text"
                  className="flex w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground cursor-not-allowed"
                  value={customers.find((c) => c.id === formCustomerId)?.fullName || ''}
                  readOnly
                />
              ) : createNewCustomer ? (
                <div className="space-y-3 rounded-lg border border-brand-gold/30 bg-brand-gold/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-brand-gold">New Customer</span>
                    <button
                      type="button"
                      onClick={() => { setCreateNewCustomer(false); setNewCustomerName(''); setNewCustomerPhone(''); setNewCustomerEmail(''); setNewCustomerType('personal'); setNewCustomerAddress(''); setNewCustomerTin(''); }}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      Use existing
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Full name *"
                    />
                    <input
                      className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Phone *"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      placeholder="Email (optional)"
                    />
                    <select
                      className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                      value={newCustomerType}
                      onChange={(e) => setNewCustomerType(e.target.value as CustomerType)}
                    >
                      <option value="personal">Personal</option>
                      <option value="business">Business</option>
                      <option value="government">Government</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      placeholder="Address (optional)"
                    />
                    <input
                      className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                      value={newCustomerTin}
                      onChange={(e) => setNewCustomerTin(e.target.value)}
                      placeholder="TIN (optional)"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCreateNewCustomer(true)}
                    className="flex items-center gap-1.5 text-xs text-brand-gold hover:underline"
                  >
                    <UserPlus className="h-3 w-3" />
                    Create new customer
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Division *</label>
              <select
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={formDivision}
                onChange={(e) => setFormDivision(e.target.value as ProjectDivision)}
              >
                {divisions.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Priority</label>
              <select
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as ProjectPriority)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Order Date *</label>
              <input
                type="date"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={formOrderDate}
                onChange={(e) => setFormOrderDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Delivery Date</label>
              <input
                type="date"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={formDeliveryDate}
                onChange={(e) => setFormDeliveryDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} loading={isCreating || isCreatingCustomer}>Create Project</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </motion.div>
  );
}
