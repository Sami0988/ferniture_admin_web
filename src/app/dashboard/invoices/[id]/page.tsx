'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetInvoiceByIdQuery, useUpdateInvoiceMutation } from '@/store/api/invoicesApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Printer, Download, CheckCircle, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: invoiceData } = useGetInvoiceByIdQuery(params.id as string);
  const [updateInvoice] = useUpdateInvoiceMutation();
  const invoice = invoiceData?.data;

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Invoice not found.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 no-print">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </button>
        <div className="flex gap-2">
          {invoice.status === 'sent' && (
            <Button onClick={() => updateInvoice({ id: invoice.id, data: { status: 'paid' } })}>
              <CheckCircle className="h-4 w-4" /> Mark Paid
            </Button>
          )}
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
              <h1 className="text-2xl font-bold text-foreground tracking-tight">PAYMENT RECEIPT</h1>
              <p className="text-sm font-mono text-muted mt-1">{invoice.invoiceNumber}</p>
              <p className="text-xs text-muted">Date: {formatDate(invoice.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 p-8 border-b border-border">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Bill To</p>
            <p className="text-sm font-semibold text-foreground">{invoice.customer?.fullName}</p>
            <p className="text-xs text-muted mt-1">Project: {invoice.project?.title}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Payment Details</p>
            <p className="text-xs text-muted">Due Date: {formatDate(invoice.dueDate)}</p>
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
                  <td className="py-3">
                    <p className="text-sm text-foreground">{item.description}</p>
                    <p className="text-[10px] text-muted capitalize">{item.category}</p>
                  </td>
                  <td className="py-3 text-center text-sm text-foreground">{item.quantity}</td>
                  <td className="py-3 text-right text-sm text-foreground">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right text-sm font-medium text-foreground">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 border-t border-border pt-4 ml-auto w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">VAT ({invoice.vatRate}%)</span>
              <span className="text-foreground">{formatCurrency(invoice.vatAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Amount Paid</span>
                  <span className="text-green-600">{formatCurrency(invoice.amountPaid)}</span>
                </div>
                {invoice.balanceDue > 0 && (
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-foreground">Balance Due</span>
                    <span className="text-red-600">{formatCurrency(invoice.balanceDue)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* QR Code placeholder */}
        <div className="px-8 pb-4">
          <div className="flex items-center gap-3 rounded-lg bg-surface-hover p-3">
            <QrCode className="h-10 w-10 text-muted" />
            <div>
              <p className="text-xs font-medium text-foreground">Scan to verify</p>
              <p className="text-[10px] text-muted">QR verification code for this receipt</p>
            </div>
          </div>
        </div>

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
    </motion.div>
  );
}
