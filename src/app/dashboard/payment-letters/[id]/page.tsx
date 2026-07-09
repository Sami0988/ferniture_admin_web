'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  useGetPaymentLetterByIdQuery,
  useUpdatePaymentLetterMutation,
  useSendPaymentLetterMutation,
  useDeletePaymentLetterMutation,
} from '@/store/api/paymentLettersApi';
import { useGetLetterTemplateByIdQuery } from '@/store/api/letterTemplatesApi';
import { useGetCompanyInfoQuery } from '@/store/api/companySettingsApi';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Download, Send, Edit, Trash2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  draft: 'warning',
  sent: 'default',
  paid: 'success',
};

export default function PaymentLetterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: letterData, isLoading } = useGetPaymentLetterByIdQuery(params.id as string);
  const [updateLetter, { isLoading: isUpdating }] = useUpdatePaymentLetterMutation();
  const [sendLetter, { isLoading: isSending }] = useSendPaymentLetterMutation();
  const [deleteLetter, { isLoading: isDeleting }] = useDeletePaymentLetterMutation();

  const letter = letterData?.data;
  
  // Fetch template if letter has a templateId
  const { data: templateData } = useGetLetterTemplateByIdQuery(letter?.templateId || '', {
    skip: !letter?.templateId,
  });
  const { data: companyData } = useGetCompanyInfoQuery();
  
  const template = templateData?.data;
  const company = companyData?.data;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    recipientCompanyName: '',
    recipientName: '',
    recipientTitle: '',
    recipientAddress: '',
    subject: '',
    body: '',
    referenceNumber: '',
    dueDate: '',
  });

  useEffect(() => {
    if (letter) {
      setEditForm({
        recipientCompanyName: letter.recipientCompanyName,
        recipientName: letter.recipientName || '',
        recipientTitle: letter.recipientTitle || '',
        recipientAddress: letter.recipientAddress || '',
        subject: letter.subject,
        body: letter.body,
        referenceNumber: letter.referenceNumber || '',
        dueDate: letter.dueDate || '',
      });
    }
  }, [letter]);

  const handleUpdate = async () => {
    try {
      await updateLetter({ id: letter!.id, data: editForm }).unwrap();
      toast.success('Payment letter updated');
      setEditModalOpen(false);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update letter';
      toast.error(message);
    }
  };

  const handleSend = async () => {
    try {
      await sendLetter(letter!.id).unwrap();
      toast.success('Payment letter sent successfully');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to send letter';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLetter(letter!.id).unwrap();
      toast.success('Payment letter deleted');
      router.push('/dashboard/payment-letters');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete letter';
      toast.error(message);
    }
  };

  // Generate letter HTML from template
  const getLetterHtml = () => {
    if (!letter) return null;
    
    const date = new Date(letter.createdAt).toLocaleDateString('en-GB');
    const dueDate = letter.dueDate ? new Date(letter.dueDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    
    // Extract header from template (everything before "Date:")
    let headerHtml = '';
    if (template?.htmlContent) {
      const dateMarker = template.htmlContent.indexOf('Date:');
      if (dateMarker !== -1) {
        // Find the div before Date:
        const beforeDate = template.htmlContent.lastIndexOf('<div', dateMarker);
        if (beforeDate !== -1) {
          headerHtml = template.htmlContent.substring(0, beforeDate);
        }
      }
      // Replace company placeholders in header
      headerHtml = headerHtml.replaceAll('{{companyName}}', company?.company_name || 'Kassahun Tsegaye Wood and Alu Works PLC');
      headerHtml = headerHtml.replaceAll('{{companyLogo}}', company?.company_logo 
        ? `<img src="${company.company_logo}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" />`
        : '');
    }
    
    // Generate body content from API data
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
  </style>
</head>
<body>
  ${headerHtml}

  <div style="text-align: right; margin: 20px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
    Date: ${date}
  </div>

  <div style="margin-bottom: 30px; line-height: 1.6;">
    To<br>
    ${letter.recipientCompanyName}<br>
    ${letter.recipientTitle || ''}<br>
    ${letter.recipientAddress || ''}
  </div>

  <div style="text-align: center; margin: 30px 0; font-size: 14px;">
    Subject: <span style="text-decoration: underline;">${letter.subject}</span>
  </div>

  <div style="font-size: 15px; line-height: 1.6;">
    ${letter.body.replace(/\n/g, '<br>')}
  </div>

  <div style="text-align: right; margin-top: 60px; line-height: 1.8;">
    Thank you for your cooperation.<br><br>
    Yours sincerely,<br>
    <strong>${company?.signatory_name || ''}</strong>
  </div>

  <div style="border-top: 1px solid #ccc; margin-top: 40px; font-size: 11px; display: flex; justify-content: space-between;">
    <span>Phone: ${company?.company_phone || ''}</span>
    <span>Email: ${company?.company_email || ''}</span>
  </div>
</body>
</html>`;
  };

  const letterHtml = getLetterHtml();

  const handleDownloadPdf = async () => {
    const html = getLetterHtml();
    if (!html) {
      toast.error('Failed to generate PDF');
      return;
    }

    // Add print styles to hide browser headers
    const printHtml = html.replace('</head>', `
  <style>
    @media print {
      @page { margin: 0; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>`);

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
        toast.success('Print dialog opened - select "Save as PDF" to download');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
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

  if (!letter) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Payment letter not found</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/payment-letters')} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const isDraft = letter.status === 'draft';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/payment-letters')} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Payment Letters
          </button>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <Button variant="secondary" onClick={() => setEditModalOpen(true)}>
              <Edit className="h-4 w-4" /> Edit
            </Button>
          )}
          <Button onClick={handleDownloadPdf}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          {isDraft && (
            <Button onClick={handleSend} loading={isSending}>
              <Send className="h-4 w-4" /> Mark as Sent
            </Button>
          )}
          {isDraft && (
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(true)} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Letter Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Letter Content */}
          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-foreground">Payment Inquiry Letter</h1>
                    <Badge variant={statusVariant[letter.status]}>{letter.status}</Badge>
                  </div>
                  <p className="text-sm font-mono text-muted">{letter.letterNumber}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <FileText className="h-4 w-4" />
                  {formatDate(letter.createdAt)}
                </div>
              </div>

              {/* Letter Content - Use template if available */}
              {letterHtml ? (
                <iframe
                  srcDoc={letterHtml}
                  sandbox=""
                  className="w-full border-0"
                  style={{ minHeight: '600px' }}
                  title="Payment Letter"
                />
              ) : (
                <>
                  {/* Letterhead - Fallback when no template */}
                  <div className="border-b border-border pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-walnut text-white font-bold text-sm">KW</div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Kassahun Wood & Aluminum Work</h2>
                        <p className="text-xs text-muted">Custom Furniture · Aluminum Fabrication · Interior Design</p>
                      </div>
                    </div>
                  </div>

                  {/* Recipient */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">To</p>
                    <p className="text-sm font-semibold text-foreground">{letter.recipientCompanyName}</p>
                    {letter.recipientName && <p className="text-sm text-foreground">{letter.recipientName}</p>}
                    {letter.recipientTitle && <p className="text-xs text-muted">{letter.recipientTitle}</p>}
                    {letter.recipientAddress && (
                      <p className="text-xs text-muted whitespace-pre-line mt-1">{letter.recipientAddress}</p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-sm font-medium text-foreground">{letter.subject}</p>
                  </div>

                  {/* Body */}
                  <div className="mb-6">
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{letter.body}</p>
                  </div>

                  {/* Signature */}
                  <div className="border-t border-border pt-6 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase mb-20">Authorized Signature</p>
                      <div className="border-t border-foreground/30 w-48" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase mb-20">Company Stamp</p>
                      <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <div className="p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Letter Details</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted">Letter Number</p>
                  <p className="text-sm font-medium text-foreground font-mono">{letter.letterNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Status</p>
                  <Badge variant={statusVariant[letter.status]}>{letter.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted">Project</p>
                  <p className="text-sm text-foreground">{letter.projectTitle || '—'}</p>
                  {letter.projectNumber && <p className="text-xs text-muted font-mono">{letter.projectNumber}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted">Customer</p>
                  <p className="text-sm text-foreground">{letter.customerName || '—'}</p>
                </div>
                {letter.referenceNumber && (
                  <div>
                    <p className="text-xs text-muted">Reference</p>
                    <p className="text-sm text-foreground font-mono">{letter.referenceNumber}</p>
                  </div>
                )}
                {letter.dueDate && (
                  <div>
                    <p className="text-xs text-muted">Due Date</p>
                    <p className="text-sm text-foreground">{formatDate(letter.dueDate)}</p>
                  </div>
                )}
                {letter.templateName && (
                  <div>
                    <p className="text-xs text-muted">Template</p>
                    <p className="text-sm text-foreground">{letter.templateName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted">Created</p>
                  <p className="text-sm text-foreground">{formatDate(letter.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Last Updated</p>
                  <p className="text-sm text-foreground">{formatDate(letter.updatedAt)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Payment Letter"
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Recipient Company Name *</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={editForm.recipientCompanyName}
              onChange={(e) => setEditForm({ ...editForm, recipientCompanyName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Contact Person</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={editForm.recipientName}
                onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Title / Department</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={editForm.recipientTitle}
                onChange={(e) => setEditForm({ ...editForm, recipientTitle: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Address</label>
            <textarea
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              rows={2}
              value={editForm.recipientAddress}
              onChange={(e) => setEditForm({ ...editForm, recipientAddress: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Subject *</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={editForm.subject}
              onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              maxLength={500}
            />
            <p className="text-[10px] text-muted">{editForm.subject.length}/500 characters</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Body *</label>
            <textarea
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold min-h-[200px]"
              value={editForm.body}
              onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
            />
            <p className="text-[10px] text-muted">Use blank lines to separate paragraphs</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Reference Number</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={editForm.referenceNumber}
                onChange={(e) => setEditForm({ ...editForm, referenceNumber: e.target.value })}
                placeholder="e.g. AWB/PROC/2026/001"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Due Date</label>
              <input
                type="date"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={isUpdating}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Payment Letter"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to delete this draft letter? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>Delete</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
