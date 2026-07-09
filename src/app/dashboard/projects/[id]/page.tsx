'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useGetProjectByIdQuery, useGetStatusHistoryQuery, useGetProjectAssigneesQuery, useGetProjectPaymentsQuery, useRecordPaymentMutation, useUpdateProjectStatusMutation, useUpdateProjectMutation, useRemoveAssigneeMutation } from '@/store/api/projectsApi';
import { useGetEmployeesQuery } from '@/store/api/employeesApi';
import { useCreateInvoiceFromProjectMutation } from '@/store/api/invoicesApi';
import { useCreatePaymentLetterMutation } from '@/store/api/paymentLettersApi';
import { useGetLetterTemplatesQuery, useGetLetterTemplateByIdQuery } from '@/store/api/letterTemplatesApi';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import StatusPill from '@/components/ui/StatusPill';
import DivisionBadge from '@/components/ui/DivisionBadge';
import { ArrowLeft, Calendar, User, Clock, Phone, Mail, MapPin, UserPlus, Check, X, Banknote, MailIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ProjectStatus, ProjectPaymentMethod } from '@/types/api';

const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
  new: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['delivered', 'cancelled'],
  delivered: ['paid', 'cancelled'],
  paid: [],
  cancelled: ['new'],
};

const paymentMethods: { value: ProjectPaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'telebirr', label: 'TeleBirr' },
  { value: 'cbe_birr', label: 'CBE Birr' },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: projectData, isLoading } = useGetProjectByIdQuery(projectId);
  const { data: historyData } = useGetStatusHistoryQuery(projectId);
  const { data: assigneesData } = useGetProjectAssigneesQuery(projectId);
  const { data: paymentData } = useGetProjectPaymentsQuery(projectId);
  const { data: employeesData } = useGetEmployeesQuery({});
  const [updateProjectStatus] = useUpdateProjectStatusMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [removeAssignee] = useRemoveAssigneeMutation();
  const [recordPayment, { isLoading: isRecordingPayment }] = useRecordPaymentMutation();
  const [createInvoiceFromProject] = useCreateInvoiceFromProjectMutation();
  const [createPaymentLetter] = useCreatePaymentLetterMutation();
  const { data: templatesData } = useGetLetterTemplatesQuery();

  const project = projectData?.data;
  const statusHistory = Array.isArray(historyData?.data) ? historyData!.data : [];
  const assignees = Array.isArray(assigneesData?.data) ? assigneesData!.data : [];
  const employees = Array.isArray(employeesData?.data) ? employeesData!.data : [];
  const paymentSummary = paymentData?.data;

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ProjectPaymentMethod>('cash');
  const [paymentNote, setPaymentNote] = useState('');

  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [letterForm, setLetterForm] = useState({
    templateId: '',
    recipientCompanyName: '',
    recipientName: '',
    recipientTitle: '',
    recipientAddress: '',
    subject: '',
    body: '',
    referenceNumber: '',
    dueDate: '',
  });

  // Fetch selected template from API
  const { data: selectedTemplateData } = useGetLetterTemplateByIdQuery(selectedTemplateId, {
    skip: !selectedTemplateId,
  });
  const selectedTemplate = selectedTemplateData?.data;

  const nextStatuses = project ? validTransitions[project.status] : [];

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    try {
      await updateProjectStatus({ id: projectId, data: { status: newStatus } }).unwrap();
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      if (newStatus === 'paid') {
        try {
          await createInvoiceFromProject(projectId).unwrap();
          toast.success('Invoice created with 15% VAT', { duration: 4000 });
        } catch (invoiceErr: any) {
          const msg = invoiceErr?.data?.message || invoiceErr?.message || 'Failed to create invoice';
          toast.error(msg);
        }
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update status';
      toast.error(message);
    }
  };

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      const result = await recordPayment({
        projectId,
        data: { amount, method: paymentMethod, note: paymentNote || undefined },
      }).unwrap();
      toast.success(`Payment of ${formatCurrency(amount)} recorded`);
      if (result.data.summary.statusChanged) {
        toast.success(`Project marked as ${result.data.summary.newStatus.replace('_', ' ')}`);
        try {
          await createInvoiceFromProject(projectId).unwrap();
          toast.success('Invoice created with 15% VAT', { duration: 4000 });
        } catch (invoiceErr: any) {
          const msg = invoiceErr?.data?.message || invoiceErr?.message || 'Failed to create invoice';
          toast.error(msg);
        }
      }
      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentMethod('cash');
      setPaymentNote('');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to record payment';
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

  const templates = templatesData?.data ?? [];
  const defaultTemplate = templates.find((t) => t.isDefault);

  // Extract values from template HTML
  const extractValuesFromHtml = (html: string) => {
    if (!html) return {};
    
    const values: Record<string, string> = {};
    
    // Extract recipient info - more flexible pattern
    const toMatch = html.match(/To\s*<br\s*\/?>\s*([\s\S]*?)\s*<br\s*\/?>\s*([\s\S]*?)\s*<br\s*\/?>\s*([\s\S]*?)\s*<\/div>/i);
    if (toMatch) {
      values.recipientCompanyName = toMatch[1].replace(/<[^>]+>/g, '').trim();
      values.recipientTitle = toMatch[2].replace(/<[^>]+>/g, '').trim();
      values.recipientAddress = toMatch[3].replace(/<[^>]+>/g, '').trim();
    }
    
    // Extract subject - handle span with text-decoration
    const subjectMatch = html.match(/Subject:\s*<span[^>]*>([^<]+)<\/span>/i) 
                      || html.match(/Subject:\s*<[^>]*>([^<]+)/i);
    if (subjectMatch) {
      values.subject = subjectMatch[1].trim();
    }
    
    // Extract body - content between subject and closing
    const bodyMatch = html.match(/font-size:\d+px;line-height:[^"]*">\s*([\s\S]*?)\s*<\/div>\s*<div[^>]*>\s*<div[^>]*>\s*(?:Thank|Yours)/i);
    if (bodyMatch) {
      values.body = bodyMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    
    return values;
  };

  // When selected template is fetched from API, extract and populate form
  const [hasExtracted, setHasExtracted] = useState(false);
  
  useEffect(() => {
    if (selectedTemplate?.htmlContent && !hasExtracted) {
      const extracted = extractValuesFromHtml(selectedTemplate.htmlContent);
      setLetterForm(prev => ({
        ...prev,
        recipientCompanyName: extracted.recipientCompanyName || prev.recipientCompanyName,
        recipientTitle: extracted.recipientTitle || prev.recipientTitle,
        recipientAddress: extracted.recipientAddress || prev.recipientAddress,
        subject: extracted.subject || prev.subject,
        body: extracted.body || prev.body,
      }));
      setHasExtracted(true);
    }
  }, [selectedTemplate, hasExtracted]);

  const handleCreateLetter = async () => {
    if (!letterForm.recipientCompanyName.trim()) {
      toast.error('Recipient company name is required');
      return;
    }
    if (!letterForm.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!letterForm.body.trim()) {
      toast.error('Body is required');
      return;
    }
    try {
      const result = await createPaymentLetter({
        projectId,
        customerId: project?.customerId,
        templateId: letterForm.templateId || defaultTemplate?.id || undefined,
        recipientCompanyName: letterForm.recipientCompanyName,
        recipientName: letterForm.recipientName || undefined,
        recipientTitle: letterForm.recipientTitle || undefined,
        recipientAddress: letterForm.recipientAddress || undefined,
        subject: letterForm.subject,
        body: letterForm.body,
        referenceNumber: letterForm.referenceNumber || undefined,
        dueDate: letterForm.dueDate || undefined,
      }).unwrap();
      toast.success('Payment letter created');
      setLetterModalOpen(false);
      setLetterForm({ templateId: '', recipientCompanyName: '', recipientName: '', recipientTitle: '', recipientAddress: '', subject: '', body: '', referenceNumber: '', dueDate: '' });
      router.push(`/dashboard/payment-letters/${result.data.id}`);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to create letter';
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
        <Button variant="outline" onClick={() => router.push('/dashboard/projects')} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/projects')}>
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
        {(project.status === 'completed' || project.status === 'delivered' || project.status === 'paid') && (
          <Button variant="secondary" onClick={() => {
            setLetterForm({
              templateId: defaultTemplate?.id || '',
              recipientCompanyName: project.customer?.fullName || '',
              recipientName: '',
              recipientTitle: '',
              recipientAddress: project.customer?.address || '',
              subject: `Request for Payment for ${project.title}`,
              body: `We are writing to formally request payment for the ${project.title} work recently completed.\n\nThe project was executed as per the agreed specifications and has been completed to the best of our ability, ensuring it meets your satisfaction.`,
              referenceNumber: '',
              dueDate: '',
            });
            setLetterModalOpen(true);
          }}>
            <MailIcon className="h-4 w-4" />
            Generate Payment Letter
          </Button>
        )}
      </div>

      {/* Status Actions */}
      <Card>
        <div className="p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Update Status</p>
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.filter((s) => s !== 'cancelled').map((status) => (
              <Button
                key={status}
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange(status)}
                title={status === 'paid' ? 'This will auto-create an invoice with 15% VAT' : undefined}
              >
                {status === 'completed' ? 'Mark Completed' : status === 'paid' ? 'Mark Paid' : status.replace('_', ' ')}
              </Button>
            ))}
            {nextStatuses.includes('cancelled') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('cancelled')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel
              </Button>
            )}
            {nextStatuses.length === 0 && project.status !== 'paid' && (
              <p className="text-sm text-muted">No status changes available</p>
            )}
            {project.status === 'paid' && (
              <p className="text-sm text-green-600 font-medium">Project completed</p>
            )}
          </div>
          {nextStatuses.includes('paid') && (
            <p className="text-[11px] text-muted mt-2">Marking as paid will auto-create an invoice with 15% VAT</p>
          )}
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

          {/* Payment Summary */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Payments</p>
                {project.status !== 'paid' && project.totalPrice != null && project.totalPrice > 0 && (
                  <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
                    <Banknote className="h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                )}
              </div>

              {project.totalPrice != null && project.totalPrice > 0 ? (
                <div className="space-y-4">
                  {/* Summary bars */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-surface-hover p-3">
                      <p className="text-[10px] text-muted uppercase">Total Price</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(project.totalPrice)}</p>
                    </div>
                    <div className="rounded-lg bg-surface-hover p-3">
                      <p className="text-[10px] text-muted uppercase">Total Paid</p>
                      <p className="text-lg font-bold text-green-600">
                        {paymentSummary ? formatCurrency(paymentSummary.totalPaid) : formatCurrency(project.paidNowPrice || 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-hover p-3">
                      <p className="text-[10px] text-muted uppercase">Remaining</p>
                      <p className={cn('text-lg font-bold', (paymentSummary?.remaining ?? project.remainingPrice ?? 0) > 0 ? 'text-red-600' : 'text-green-600')}>
                        {paymentSummary ? formatCurrency(paymentSummary.remaining) : formatCurrency(project.remainingPrice || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-muted mb-1">
                      <span>Payment Progress</span>
                      <span>
                        {paymentSummary
                          ? `${Math.min(100, Math.round((paymentSummary.totalPaid / project.totalPrice) * 100))}%`
                          : `${Math.min(100, Math.round(((project.paidNowPrice || 0) / project.totalPrice) * 100))}%`
                        }
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{
                          width: `${paymentSummary
                            ? Math.min(100, (paymentSummary.totalPaid / project.totalPrice) * 100)
                            : Math.min(100, ((project.paidNowPrice || 0) / project.totalPrice) * 100)
                          }%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment history */}
                  {paymentSummary && paymentSummary.payments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted mb-2">Payment History</p>
                      <div className="space-y-2">
                        {paymentSummary.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-3.5 w-3.5 text-muted" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{formatCurrency(p.amount)}</p>
                                <p className="text-[10px] text-muted capitalize">{p.method.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {p.note && <p className="text-[10px] text-muted">{p.note}</p>}
                              <p className="text-[10px] text-muted">{formatDate(p.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">No pricing set for this project</p>
              )}
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

      {/* Record Payment Modal */}
      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-hover p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total Price</span>
              <span className="font-medium text-foreground">{formatCurrency(project.totalPrice || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Already Paid</span>
              <span className="font-medium text-green-600">
                {formatCurrency(paymentSummary?.totalPaid ?? project.paidNowPrice ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-border mt-2 pt-2">
              <span className="text-muted">Remaining</span>
              <span className="font-medium text-red-600">
                {formatCurrency(paymentSummary?.remaining ?? project.remainingPrice ?? 0)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Amount (ETB) *</label>
            <input
              type="number"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Payment Method *</label>
            <select
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as ProjectPaymentMethod)}
            >
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Note (optional)</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g. First installment"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} loading={isRecordingPayment}>Record Payment</Button>
          </div>
        </div>
      </Modal>

      {/* Generate Payment Letter Modal */}
      <Modal
        open={letterModalOpen}
        onClose={() => setLetterModalOpen(false)}
        title="Generate Payment Letter"
        size="lg"
      >
        <div className="space-y-4">
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Template *</label>
              <select
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={letterForm.templateId}
                onChange={(e) => {
                  const templateId = e.target.value;
                  setSelectedTemplateId(templateId);
                  setHasExtracted(false);
                  setLetterForm({ ...letterForm, templateId });
                }}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Recipient Company Name *</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={letterForm.recipientCompanyName}
              onChange={(e) => setLetterForm({ ...letterForm, recipientCompanyName: e.target.value })}
              placeholder="e.g. Awash Bank Head Office"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Contact Person</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={letterForm.recipientName}
                onChange={(e) => setLetterForm({ ...letterForm, recipientName: e.target.value })}
                placeholder="e.g. Ato Bekele"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Title / Department</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={letterForm.recipientTitle}
                onChange={(e) => setLetterForm({ ...letterForm, recipientTitle: e.target.value })}
                placeholder="e.g. Procurement Division"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Address</label>
            <textarea
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              rows={2}
              value={letterForm.recipientAddress}
              onChange={(e) => setLetterForm({ ...letterForm, recipientAddress: e.target.value })}
              placeholder="e.g. Addis Ababa, Ethiopia"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Subject *</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={letterForm.subject}
              onChange={(e) => setLetterForm({ ...letterForm, subject: e.target.value })}
              maxLength={500}
            />
            <p className="text-[10px] text-muted">{letterForm.subject.length}/500 characters</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Body *</label>
            <textarea
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold min-h-[200px]"
              value={letterForm.body}
              onChange={(e) => setLetterForm({ ...letterForm, body: e.target.value })}
              placeholder="Write the letter body here. Use blank lines to separate paragraphs."
            />
            <p className="text-[10px] text-muted">Use blank lines to separate paragraphs</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Reference Number</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={letterForm.referenceNumber}
                onChange={(e) => setLetterForm({ ...letterForm, referenceNumber: e.target.value })}
                placeholder="e.g. AWB/PROC/2026/001"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Due Date</label>
              <input
                type="date"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={letterForm.dueDate}
                onChange={(e) => setLetterForm({ ...letterForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setLetterModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLetter}>Create Letter</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
