'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGetProjectByIdQuery, useGetStatusHistoryQuery, useGetProjectAssigneesQuery, useUpdateProjectStatusMutation, useUpdateProjectMutation, useRemoveAssigneeMutation } from '@/store/api/projectsApi';
import { useGetEmployeesQuery } from '@/store/api/employeesApi';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import StatusPill from '@/components/ui/StatusPill';
import DivisionBadge from '@/components/ui/DivisionBadge';
import { ArrowLeft, Calendar, User, Clock, Phone, Mail, MapPin, UserPlus, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ProjectStatus } from '@/types/api';

const statusFlow: ProjectStatus[] = ['new', 'in_progress', 'completed', 'delivered', 'paid'];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: projectData, isLoading } = useGetProjectByIdQuery(projectId);
  const { data: historyData } = useGetStatusHistoryQuery(projectId);
  const { data: assigneesData } = useGetProjectAssigneesQuery(projectId);
  const { data: employeesData } = useGetEmployeesQuery({});
  const [updateProjectStatus] = useUpdateProjectStatusMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [removeAssignee] = useRemoveAssigneeMutation();

  const project = projectData?.data;
  const statusHistory = Array.isArray(historyData?.data) ? historyData!.data : [];
  const assignees = Array.isArray(assigneesData?.data) ? assigneesData!.data : [];
  const employees = Array.isArray(employeesData?.data) ? employeesData!.data : [];

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    try {
      await updateProjectStatus({ id: projectId, data: { status: newStatus } }).unwrap();
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update status';
      toast.error(message);
    }
  };

  const openAssignModal = () => {
    setSelectedEmployeeIds(assignees.map((a) => a.id));
    setAssignModalOpen(true);
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    try {
      await updateProject({ id: projectId, data: { assigneeIds: selectedEmployeeIds } }).unwrap();
      toast.success('Assignees updated successfully');
      setAssignModalOpen(false);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to assign employees';
      toast.error(message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignee = async (employeeId: string) => {
    try {
      await removeAssignee({ projectId, employeeId }).unwrap();
      toast.success('Employee removed from project');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to remove employee';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
        <div className="h-64 bg-surface-hover rounded animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Project not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
            <DivisionBadge division={project.division} size="md" />
            <StatusPill status={project.status} />
          </div>
          <p className="text-sm text-muted mt-1 font-mono">{project.projectNumber}</p>
        </div>
        <Button onClick={openAssignModal}>
          <UserPlus className="h-4 w-4" />
          Assign Employee
        </Button>
      </div>

      {/* Status Actions */}
      <Card>
        <div className="p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Update Status</p>
          <div className="flex gap-2 flex-wrap">
            {statusFlow.map((status) => (
              <Button
                key={status}
                variant={project.status === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(status)}
                disabled={project.status === status}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
            {project.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('cancelled')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {project.description && (
            <Card>
              <div className="p-4">
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm text-foreground">{project.description}</p>
              </div>
            </Card>
          )}

          {/* Details */}
          <Card>
            <div className="p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted mb-1">Priority</p>
                  <span className={cn('text-sm font-medium capitalize', {
                    'text-red-600': project.priority === 'urgent',
                    'text-purple-600': project.priority === 'vip',
                    'text-slate-500': project.priority === 'normal',
                  })}>
                    {project.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Customer</p>
                  <p className="text-sm font-medium text-foreground">{project.customer?.fullName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Order Date</p>
                  <div className="flex items-center gap-1 text-sm text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted" />
                    {formatDate(project.orderDate || '')}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Delivery Date</p>
                  <div className="flex items-center gap-1 text-sm text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted" />
                    {formatDate(project.deliveryDate || '')}
                  </div>
                </div>
                {project.completedAt && (
                  <div>
                    <p className="text-xs text-muted mb-1">Completed At</p>
                    <p className="text-sm text-foreground">{formatDate(project.completedAt)}</p>
                  </div>
                )}
                {project.deliveredAt && (
                  <div>
                    <p className="text-xs text-muted mb-1">Delivered At</p>
                    <p className="text-sm text-foreground">{formatDate(project.deliveredAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          {project.customer && (
            <Card>
              <div className="p-4">
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Customer</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold text-foreground">
                      {project.customer.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{project.customer.fullName}</p>
                      <span className="text-[10px] text-muted capitalize">{project.customer.type}</span>
                    </div>
                  </div>
                  {project.customer.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Phone className="h-3 w-3" />
                      {project.customer.phone}
                    </div>
                  )}
                  {project.customer.email && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Mail className="h-3 w-3" />
                      {project.customer.email}
                    </div>
                  )}
                  {project.customer.address && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <MapPin className="h-3 w-3" />
                      {project.customer.address}
                    </div>
                  )}
                  {project.customer.tinNumber && (
                    <p className="text-[10px] text-muted font-mono">TIN: {project.customer.tinNumber}</p>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/dashboard/customers/${project.customer!.id}`)}
                  className="mt-3 w-full text-center text-xs text-brand-gold hover:underline"
                >
                  View Customer Profile
                </button>
              </div>
            </Card>
          )}

          {/* Assignees */}
          <Card>
            <div className="p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Assigned Team</p>
              {assignees.length > 0 ? (
                <div className="space-y-2">
                  {assignees.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-hover">
                      <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center text-sm font-bold text-foreground">
                        {a.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{a.fullName}</p>
                        <p className="text-xs text-muted">{a.phone}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignee(a.id)}
                        className="rounded-lg p-1.5 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove from project"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No assignees</p>
              )}
            </div>
          </Card>

          {/* Status History */}
          <Card>
            <div className="p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Status History</p>
              {statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {statusHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-foreground">
                          <span className="font-medium">{entry.changedByName}</span> changed status
                        </p>
                        <p className="text-[10px] text-muted">
                          {entry.oldStatus.replace('_', ' ')} → {entry.newStatus.replace('_', ' ')}
                        </p>
                        {entry.notes && (
                          <p className="text-[10px] text-muted mt-0.5 italic">"{entry.notes}"</p>
                        )}
                        <p className="text-[10px] text-muted">{formatDate(entry.changedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No status changes yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Assign Employee Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Employees"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Select employees to assign to this project:</p>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {employees.filter((e) => e.isActive).map((emp) => {
              const isSelected = selectedEmployeeIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    isSelected ? 'border-brand-gold bg-brand-gold/5' : 'border-border hover:bg-surface-hover'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded border flex items-center justify-center',
                    isSelected ? 'bg-brand-gold border-brand-gold' : 'border-border'
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{emp.fullName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>{emp.specialty.replace('_', ' ')}</span>
                      {emp.email && <span>{emp.email}</span>}
                      <span>{emp.phone}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {employees.filter((e) => e.isActive).length === 0 && (
              <p className="text-sm text-muted text-center py-4">No active employees found</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} loading={isAssigning}>
              Save Assignments ({selectedEmployeeIds.length})
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
