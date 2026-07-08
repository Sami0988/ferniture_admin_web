'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGetInvoiceByIdQuery, useRecordInvoicePaymentMutation, useEmailInvoiceMutation, useLazyGetInvoicePdfQuery } from '@/store/api/invoicesApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Printer, Download, Mail, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ProjectPaymentMethod } from '@/types/api';

const paymentMethods: { value: ProjectPaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'telebirr', label: 'TeleBirr' },
  { value: 'cbe_birr', label: 'CBE Birr' },
];

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  unpaid: 'danger',
  partial: 'warning',
  paid: 'success',
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: invoiceData, isLoading } = useGetInvoiceByIdQuery(params.id as string);
  const [recordPayment, { isLoading: isRecording }] = useRecordInvoicePaymentMutation();
  const [emailInvoice, { isLoading: isEmailing }] = useEmailInvoiceMutation();
  const [getInvoicePdf] = useLazyGetInvoicePdfQuery();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const invoice = invoiceData?.data;

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ProjectPaymentMethod>('cash');
  const [paymentReference, setPaymentReference] = useState('');

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await recordPayment({
        id: invoice!.id,
        data: {
          amount,
          method: paymentMethod,
          referenceNumber: paymentReference || undefined,
          paidAt: new Date().toISOString(),
        },
      }).unwrap();
      toast.success(`Payment of ${formatCurrency(amount)} recorded`);
      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentMethod('cash');
      setPaymentReference('');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to record payment';
      toast.error(message);
    }
  };

  const handleEmail = async () => {
    try {
      const result = await emailInvoice(invoice!.id).unwrap();
      toast.success(result.message || 'Invoice emailed successfully');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to email invoice';
      toast.error(message);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Invoice ${invoice!.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; margin-bottom: 24px; }
            .company { display: flex; align-items: center; gap: 16px; }
            .logo { width: 64px; height: 64px; background: #5C3A21; color: #fff; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-weight: bold; font-size: 20px; }
            .company-name { font-size: 24px; font-weight: 700; color: #111827; }
            .company-sub { font-size: 13px; color: #6b7280; margin-top: 4px; }
            .company-addr { font-size: 12px; color: #9ca3af; margin-top: 2px; }
            .invoice-right { text-align: right; }
            .invoice-right h1 { font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
            .inv-num { font-size: 14px; color: #6b7280; font-family: monospace; margin-top: 6px; }
            .inv-date { font-size: 12px; color: #9ca3af; margin-top: 4px; }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-top: 10px; text-transform: capitalize; }
            .badge-paid { background: #dcfce7; color: #16a34a; }
            .badge-partial { background: #fef3c7; color: #d97706; }
            .badge-unpaid { background: #fee2e2; color: #dc2626; }
            
            .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding: 20px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
            .label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
            .value { font-size: 14px; font-weight: 600; color: #111827; }
            .sub-value { font-size: 12px; color: #6b7280; margin-top: 4px; }
            .text-right { text-align: right; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { text-align: left; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 0; border-bottom: 2px solid #e5e7eb; }
            th:nth-child(2) { text-align: center; }
            th:nth-child(3), th:nth-child(4) { text-align: right; }
            td { padding: 14px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
            td:nth-child(2) { text-align: center; }
            td:nth-child(3), td:nth-child(4) { text-align: right; }
            
            .totals { width: 280px; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #374151; }
            .total-row.border { border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px; }
            .total-row.grand { font-weight: 700; font-size: 18px; color: #111827; }
            .muted { color: #6b7280; }
            .green { color: #16a34a; }
            .red { color: #dc2626; }
            
            .payments { margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb; }
            .payments-title { font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
            .pay-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #f9fafb; border-radius: 10px; margin-bottom: 10px; }
            .pay-left { display: flex; align-items: center; gap: 12px; }
            .pay-icon { width: 32px; height: 32px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
            .pay-amount { font-size: 14px; font-weight: 600; color: #111827; }
            .pay-method { font-size: 11px; color: #6b7280; text-transform: capitalize; margin-top: 2px; }
            .pay-date { font-size: 11px; color: #9ca3af; text-align: right; }
            
            .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
            .sig-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; margin-bottom: 80px; }
            .sig-line { border-top: 1px solid rgba(0,0,0,0.3); width: 200px; padding-top: 8px; font-size: 12px; color: #6b7280; }
            .stamp { width: 88px; height: 88px; border: 2px dashed #d1d5db; border-radius: 8px; margin-bottom: 80px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company">
                <div class="logo">KW</div>
                <div>
                  <div class="company-name">Kassahun Wood & Aluminum Work</div>
                  <div class="company-sub">Custom Furniture · Aluminum Fabrication · Interior Design</div>
                  <div class="company-addr">Addis Ababa, Ethiopia · +251 91 123 4567</div>
                </div>
              </div>
              <div class="invoice-right">
                <h1>INVOICE</h1>
                <div class="inv-num">${invoice!.invoiceNumber}</div>
                <div class="inv-date">Date: ${formatDate(invoice!.createdAt)}</div>
                <div class="badge badge-${invoice!.paymentStatus}">${invoice!.paymentStatus}</div>
              </div>
            </div>
            
            <div class="info-row">
              <div>
                <div class="label">Bill To</div>
                <div class="value">${invoice!.customerName}</div>
                ${invoice!.customerPhone ? `<div class="sub-value">${invoice!.customerPhone}</div>` : ''}
                ${invoice!.customerEmail ? `<div class="sub-value">${invoice!.customerEmail}</div>` : ''}
              </div>
              <div class="text-right">
                <div class="label">Project</div>
                <div class="value">${invoice!.projectTitle}</div>
                <div class="sub-value" style="font-family: monospace;">${invoice!.projectNumber}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice!.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(parseFloat(item.unitPrice))}</td>
                    <td style="font-weight: 600;">${formatCurrency(parseFloat(item.total))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-row">
                <span class="muted">Subtotal</span>
                <span>${formatCurrency(parseFloat(invoice!.subtotal))}</span>
              </div>
              ${parseFloat(invoice!.discountAmount) > 0 ? `
              <div class="total-row">
                <span class="muted">Discount</span>
                <span class="green">-${formatCurrency(parseFloat(invoice!.discountAmount))}</span>
              </div>
              ` : ''}
              <div class="total-row">
                <span class="muted">VAT (${invoice!.vatRate}%)</span>
                <span>${formatCurrency(parseFloat(invoice!.vatAmount))}</span>
              </div>
              <div class="total-row border grand">
                <span>Total</span>
                <span>${formatCurrency(parseFloat(invoice!.totalAmount))}</span>
              </div>
              ${parseFloat(invoice!.totalPaid) > 0 ? `
              <div class="total-row">
                <span class="muted">Amount Paid</span>
                <span class="green">${formatCurrency(parseFloat(invoice!.totalPaid))}</span>
              </div>
              ` : ''}
              ${parseFloat(invoice!.balanceDue) > 0 ? `
              <div class="total-row" style="font-weight: 600;">
                <span>Balance Due</span>
                <span class="red">${formatCurrency(parseFloat(invoice!.balanceDue))}</span>
              </div>
              ` : ''}
            </div>
            
            ${invoice!.payments.length > 0 ? `
            <div class="payments">
              <div class="payments-title">Payment History</div>
              ${invoice!.payments.map(p => `
                <div class="pay-item">
                  <div class="pay-left">
                    <div class="pay-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
                    </div>
                    <div>
                      <div class="pay-amount">${formatCurrency(parseFloat(p.amount))}</div>
                      <div class="pay-method">${p.method.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div class="pay-date">${formatDate(p.paidAt)}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}
            
            <div class="footer">
              <div>
                <div class="sig-label">Authorized Signature</div>
                <div class="sig-line"></div>
              </div>
              <div>
                <div class="sig-label">Company Stamp</div>
                <div class="stamp"></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const result = await getInvoicePdf(invoice!.id).unwrap();
      const pdfUrl = result?.data?.pdfUrl;
      if (pdfUrl) {
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice!.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF downloaded');
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to download PDF';
      toast.error(message);
    } finally {
      setIsDownloadingPdf(false);
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

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Invoice not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 no-print">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </button>
        <div className="flex gap-2">
          {invoice.paymentStatus !== 'paid' && (
            <Button onClick={() => setPaymentModalOpen(true)}>
              <Banknote className="h-4 w-4" /> Record Payment
            </Button>
          )}
          <Button variant="secondary" onClick={handleEmail} loading={isEmailing}>
            <Mail className="h-4 w-4" /> Email
          </Button>
          <Button variant="secondary" onClick={handleDownloadPdf} loading={isDownloadingPdf}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="print-area mx-auto max-w-[800px] rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {/* Letterhead */}
        <div className="relative border-b border-border p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #5C3A21 25%, transparent 25%, transparent 50%, #8C929B 50%, #8C929B 75%, transparent 75%)', backgroundSize: '20px 20px' }} />
          </div>
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-walnut text-white font-bold text-lg">KW</div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Kassahun Wood & Aluminum Work</h2>
                <p className="text-xs text-muted">Custom Furniture &middot; Aluminum Fabrication &middot; Interior Design</p>
                <p className="text-xs text-muted mt-0.5">Addis Ababa, Ethiopia &middot; +251 91 123 4567</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">INVOICE</h1>
              <p className="text-sm font-mono text-muted mt-1">{invoice.invoiceNumber}</p>
              <p className="text-xs text-muted">Date: {formatDate(invoice.createdAt)}</p>
              <div className="mt-2">
                <Badge variant={statusVariant[invoice.paymentStatus]}>{invoice.paymentStatus}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 p-8 border-b border-border">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Bill To</p>
            <p className="text-sm font-semibold text-foreground">{invoice.customerName}</p>
            {invoice.customerPhone && <p className="text-xs text-muted mt-1">{invoice.customerPhone}</p>}
            {invoice.customerEmail && <p className="text-xs text-muted">{invoice.customerEmail}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Project</p>
            <p className="text-sm font-medium text-foreground">{invoice.projectTitle}</p>
            <p className="text-xs text-muted font-mono">{invoice.projectNumber}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-xs font-semibold text-muted uppercase">Description</th>
                <th className="pb-2 text-center text-xs font-semibold text-muted uppercase">Qty</th>
                <th className="pb-2 text-right text-xs font-semibold text-muted uppercase">Unit Price</th>
                <th className="pb-2 text-right text-xs font-semibold text-muted uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-foreground">{item.description}</td>
                  <td className="py-3 text-center text-sm text-foreground">{item.quantity}</td>
                  <td className="py-3 text-right text-sm text-foreground">{formatCurrency(parseFloat(item.unitPrice))}</td>
                  <td className="py-3 text-right text-sm font-medium text-foreground">{formatCurrency(parseFloat(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 border-t border-border pt-4 ml-auto w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="text-foreground">{formatCurrency(parseFloat(invoice.subtotal))}</span>
            </div>
            {parseFloat(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Discount</span>
                <span className="text-green-600">-{formatCurrency(parseFloat(invoice.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted">VAT ({invoice.vatRate}%)</span>
              <span className="text-foreground">{formatCurrency(parseFloat(invoice.vatAmount))}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatCurrency(parseFloat(invoice.totalAmount))}</span>
            </div>
            {parseFloat(invoice.totalPaid) > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Amount Paid</span>
                  <span className="text-green-600">{formatCurrency(parseFloat(invoice.totalPaid))}</span>
                </div>
                {parseFloat(invoice.balanceDue) > 0 && (
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-foreground">Balance Due</span>
                    <span className="text-red-600">{formatCurrency(parseFloat(invoice.balanceDue))}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <div className="px-8 pb-8">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Payment History</p>
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-3.5 w-3.5 text-muted" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatCurrency(parseFloat(p.amount))}</p>
                      <p className="text-[10px] text-muted capitalize">{p.method.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {p.referenceNumber && <p className="text-[10px] text-muted">{p.referenceNumber}</p>}
                    <p className="text-[10px] text-muted">{formatDate(p.paidAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border p-8 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-muted uppercase mb-8">Authorized Signature</p>
            <div className="border-t border-foreground/30 w-48" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase mb-8">Company Stamp</p>
            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border" />
          </div>
        </div>
      </div>

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
              <span className="text-muted">Total Amount</span>
              <span className="font-medium text-foreground">{formatCurrency(parseFloat(invoice.totalAmount))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Already Paid</span>
              <span className="font-medium text-green-600">{formatCurrency(parseFloat(invoice.totalPaid))}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border mt-2 pt-2">
              <span className="text-muted">Balance Due</span>
              <span className="font-medium text-red-600">{formatCurrency(parseFloat(invoice.balanceDue))}</span>
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
            <label className="block text-sm font-medium text-foreground">Reference Number (optional)</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. TXN-123456"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} loading={isRecording}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
