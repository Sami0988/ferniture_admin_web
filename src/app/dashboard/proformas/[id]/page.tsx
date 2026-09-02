'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useGetProformaQuery,
  useSendProformaMutation,
  useAcceptProformaMutation,
  useCancelProformaMutation,
  useDeleteProformaMutation,
} from '@/store/api/proformasApi';
import { useGetCompanyInfoQuery } from '@/store/api/companySettingsApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import StatusBadge from '@/features/proformas/StatusBadge';
import { ArrowLeft, Download, Send, CheckCircle, XCircle, Trash2, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { ProformaStatus } from '@/types/api';

const allStatuses: { status: ProformaStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'sent', label: 'Sent' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'expired', label: 'Expired' },
  { status: 'cancelled', label: 'Cancelled' },
];

const statusOrder: ProformaStatus[] = ['draft', 'sent', 'accepted', 'expired', 'cancelled'];

const statusColors: Record<string, string> = {
  draft: '#6b7280',
  sent: '#2563eb',
  accepted: '#16a34a',
  expired: '#d97706',
  cancelled: '#dc2626',
};

export default function ProformaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: proformaData, isLoading } = useGetProformaQuery(id);
  const { data: companyData } = useGetCompanyInfoQuery();
  const [sendProforma, { isLoading: isSending }] = useSendProformaMutation();
  const [acceptProforma, { isLoading: isAccepting }] = useAcceptProformaMutation();
  const [cancelProforma, { isLoading: isCancelling }] = useCancelProformaMutation();
  const [deleteProforma, { isLoading: isDeleting }] = useDeleteProformaMutation();

  const proforma = proformaData?.data;
  const company = companyData?.data;

  const buildProformaHtml = () => {
    if (!proforma) return null;

    const logoHtml = company?.company_logo
      ? `<img src="${company.company_logo}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" />`
      : '<span style="color:#5C3A21;font-weight:800;font-size:18px;">KW</span>';

    const materialSummary = [...new Set(proforma.items.map((i: any) => i.description))].join(', ');
    const formattedDate = formatDate(proforma.createdAt);
    const validityText = proforma.validityDays === 1
      ? `This pro-forma is valid only for ${proforma.validityDays} day`
      : `This pro-forma is valid only for ${proforma.validityDays} days`;

    const itemRows = proforma.items.map((item: any) => `
      <tr>
        <td style="border:1px solid #d1d5db;padding:10px 12px;font-size:13px;color:#111827;">${item.description}</td>
        <td style="border:1px solid #d1d5db;padding:10px 12px;font-size:13px;color:#4b5563;text-align:center;">${item.unit}</td>
        <td style="border:1px solid #d1d5db;padding:10px 12px;font-size:13px;color:#111827;text-align:center;">${item.quantity}</td>
        <td style="border:1px solid #d1d5db;padding:10px 12px;font-size:13px;color:#111827;text-align:right;">${formatCurrency(item.unitPrice)}</td>
        <td style="border:1px solid #d1d5db;padding:10px 12px;font-size:13px;font-weight:600;color:#111827;text-align:right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    const discountRow = proforma.discountAmount > 0
      ? `<tr>
          <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px;color:#4b5563;">Discount</td>
          <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px;color:#16a34a;text-align:right;font-weight:500;">-${formatCurrency(proforma.discountAmount)}</td>
        </tr>`
      : '';

    const footerParts = [
      company?.company_phone ? `Phone: ${company.company_phone}` : '',
      company?.company_email ? `Email: ${company.company_email}` : '',
    ].filter(Boolean);
    const footerHtml = footerParts.length
      ? `<div class="proforma-footer" style="margin:0 32px 24px;border-top:1px solid #d1d5db;padding-top:12px;text-align:center;font-size:11px;color:#6b7280;">
          ${footerParts.join(' &nbsp;&nbsp;|&nbsp;&nbsp; ')}
        </div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  @page { margin: 0; size: A4; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; }
  .proforma-capture { width: 794px; min-height: 1062px; background: #ffffff; margin: 0 auto; padding: 0; position: relative; }
  .proforma-footer { position: absolute; left: 0; right: 0; bottom: 0; }
</style>
</head>
<body>
<div class="proforma-capture">

  <!-- Header Banner (logo + company name only) -->
  <div style="position:relative;height:90px;overflow:hidden;">
    <!-- Diagonal stripes -->
    <div style="position:absolute;top:0;left:0;width:200px;height:90px;overflow:hidden;">
      <div style="position:absolute;top:-50px;left:-60px;width:130px;height:220px;background:#5C3A21;transform:rotate(-20deg);"></div>
      <div style="position:absolute;top:-50px;left:-5px;width:90px;height:220px;background:#C8913A;transform:rotate(-20deg);"></div>
      <div style="position:absolute;top:-50px;left:40px;width:55px;height:220px;background:#5C3A21;transform:rotate(-20deg);"></div>
    </div>
    <!-- Diamond logo badge -->
    <div style="position:absolute;top:5px;left:50px;z-index:20;">
      <div style="background:#C8913A;transform:rotate(45deg);width:80px;height:80px;display:flex;align-items:center;justify-content:center;border-radius:4px;">
        <div style="width:66px;height:66px;background:#fff;border-radius:50%;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;overflow:hidden;">
          ${logoHtml}
        </div>
      </div>
    </div>
    <!-- Company name banner -->
    <div style="position:absolute;top:10px;left:145px;right:24px;height:70px;z-index:10;">
      <div style="height:100%;background:#C8913A;padding:3px;border-radius:2px;">
        <div style="height:100%;background:#5C3A21;display:flex;align-items:center;justify-content:center;padding:0 30px;border-radius:2px;">
          <span style="color:#fff;font-weight:700;font-size:20px;letter-spacing:0.8px;text-align:center;line-height:1.3;">
            ${company?.company_name || 'Kassahun Tsegaye Wood and Alu Works Plc'}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Document info row: title, number, date (no status badge on the PDF) -->
  <div style="margin:20px 32px 0;">
    <h1 style="color:#5C3A21;font-weight:800;font-size:20px;letter-spacing:-0.5px;text-transform:uppercase;margin:0;">Proforma Invoice</h1>
    <p style="color:#111827;font-size:13px;font-weight:600;font-family:monospace;margin:6px 0 0 0;">${proforma.proformaNumber}</p>
    <p style="color:#6b7280;font-size:12px;margin:2px 0 0 0;">${formattedDate}</p>
  </div>

  <!-- Subject -->
  ${proforma.subject ? `
  <div style="margin:24px 32px 0;text-align:center;">
    <h2 style="font-size:18px;font-weight:700;color:#111827;text-transform:uppercase;text-decoration:underline;text-underline-offset:4px;margin:0;">${proforma.subject}</h2>
  </div>` : ''}

  <!-- Billed To / Material box -->
  <div style="margin:32px 32px 0;display:inline-block;border:1px solid #d1d5db;border-radius:6px;">
    <table style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td style="padding:16px;border-right:1px solid #d1d5db;vertical-align:top;">
            <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px 0;">Billed To</p>
            <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${proforma.billedToName}</p>
          </td>
          <td style="padding:16px;vertical-align:top;max-width:200px;">
            <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px 0;">Material</p>
            <p style="font-size:13px;color:#111827;word-wrap:break-word;margin:0;">${materialSummary || '—'}</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Line items table -->
  <div style="margin:32px 32px 0;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="border:1px solid #d1d5db;padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
          <th style="border:1px solid #d1d5db;padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;">Unit</th>
          <th style="border:1px solid #d1d5db;padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
          <th style="border:1px solid #d1d5db;padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;">Rate</th>
          <th style="border:1px solid #d1d5db;padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${proforma.items.length === 0 ? `
        <tr>
          <td colspan="5" style="border:1px solid #d1d5db;padding:24px;text-align:center;font-size:13px;color:#9ca3af;">No items</td>
        </tr>` : ''}
      </tbody>
    </table>
  </div>

  <!-- Totals box -->
  <div style="margin:24px 32px 0;display:flex;justify-content:flex-end;">
    <div style="width:288px;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr>
            <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px;color:#4b5563;">Subtotal</td>
            <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px;color:#111827;text-align:right;font-weight:500;">${formatCurrency(proforma.subtotal)}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px;color:#4b5563;">VAT (${proforma.vatRate}%)</td>
            <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px;color:#111827;text-align:right;font-weight:500;">${formatCurrency(proforma.vatAmount)}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="border:1px solid #d1d5db;padding:10px 12px;font-size:14px;font-weight:700;color:#111827;">TOTAL</td>
            <td style="border:1px solid #d1d5db;padding:10px 12px;font-size:14px;font-weight:700;color:#111827;text-align:right;">${formatCurrency(proforma.totalAmount)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Validity note -->
  <div style="margin:24px 32px 0;text-align:center;">
    <p style="font-size:12px;color:#6b7280;font-style:italic;margin:0;">${validityText}</p>
  </div>

  <!-- Signature block -->
  <div style="margin:40px 32px 16px;">
    <p style="font-size:13px;color:#374151;margin:0;">Yours sincerely,</p>
    <p style="font-size:13px;font-weight:600;color:#111827;margin:32px 0 0 0;">${company?.signatory_name || ''}</p>
  </div>

  <!-- Footer -->
  ${footerHtml}

</div>
</body>
</html>`;
  };

  const handleDownloadPdf = async () => {
    const html = buildProformaHtml();
    if (!html) {
      toast.error('Failed to generate PDF');
      return;
    }

    setIsDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.createElement('div');
      element.innerHTML = html;
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.width = '794px';
      document.body.appendChild(element);

      const captureTarget = element.querySelector('.proforma-capture') as HTMLElement || element;

      await html2pdf()
        .set({
          margin: [8, 0, 8, 0],
          filename: `${proforma?.proformaNumber || 'proforma'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff',
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(captureTarget)
        .save();

      document.body.removeChild(element);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSend = async () => {
    try {
      await sendProforma(id).unwrap();
      toast.success('Proforma sent to customer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send proforma');
    }
  };

  const handleAccept = async () => {
    try {
      await acceptProforma(id).unwrap();
      toast.success('Proforma marked as accepted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to accept proforma');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelProforma(id).unwrap();
      toast.success('Proforma cancelled');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel proforma');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this proforma?')) return;
    try {
      await deleteProforma(id).unwrap();
      toast.success('Proforma deleted');
      router.push('/dashboard/proformas');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete proforma');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
        <div className="h-64 bg-surface-hover rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!proforma) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Proforma not found</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/proformas')} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(proforma.status);
  const materialSummary = [...new Set(proforma.items.map((i) => i.description))].join(', ');
  const validityText = proforma.validityDays === 1
    ? `This pro-forma is valid only for ${proforma.validityDays} day`
    : `This pro-forma is valid only for ${proforma.validityDays} days`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => router.push('/dashboard/proformas')} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Proformas
        </button>
        <div className="flex gap-2">
          {proforma.status === 'draft' && (
            <Link href={`/dashboard/proformas/${id}/edit`}>
              <Button variant="secondary"><Edit3 className="h-4 w-4" /> Edit</Button>
            </Link>
          )}
          <Button variant="secondary" onClick={handleDownloadPdf} loading={isDownloading}>
            <Download className="h-4 w-4" /> {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
          {proforma.status === 'draft' && (
            <Button onClick={handleSend} loading={isSending}>
              <Send className="h-4 w-4" /> Send to customer
            </Button>
          )}
          {proforma.status === 'sent' && (
            <>
              <Button variant="danger" onClick={handleCancel} loading={isCancelling}>
                <XCircle className="h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleAccept} loading={isAccepting}>
                <CheckCircle className="h-4 w-4" /> Mark accepted
              </Button>
            </>
          )}
          {proforma.status === 'draft' && (
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="rounded-xl border border-border bg-surface p-4 no-print">
        <div className="flex items-center justify-between">
          {allStatuses.map((s, i) => {
            const isActive = s.status === proforma.status;
            const isPast = i < currentStatusIndex;
            return (
              <div key={s.status} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                      isActive && 'bg-brand-gold text-white ring-2 ring-brand-gold/20',
                      isPast && 'bg-green-100 text-green-700',
                      !isActive && !isPast && 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isPast ? '✓' : i + 1}
                  </div>
                  <span className={cn(
                    'text-[10px] mt-1 font-medium',
                    isActive ? 'text-brand-gold' : isPast ? 'text-green-600' : 'text-muted'
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < allStatuses.length - 1 && (
                  <div className={cn(
                    'h-0.5 w-12 sm:w-20 mx-2',
                    i < currentStatusIndex ? 'bg-green-300' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DOCUMENT CARD — Company Letterhead */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">

        {/* Header banner (logo + company name only) */}
        <div className="relative h-[90px] overflow-hidden">
          <div className="absolute top-0 left-0 w-[200px] h-[90px] overflow-hidden">
            <div className="absolute -top-[50px] -left-[60px] w-[130px] h-[220px] bg-[#5C3A21] -rotate-[20deg]" />
            <div className="absolute -top-[50px] -left-[-5px] w-[90px] h-[220px] bg-[#C8913A] -rotate-[20deg]" />
            <div className="absolute -top-[50px] left-[40px] w-[55px] h-[220px] bg-[#5C3A21] -rotate-[20deg]" />
          </div>
          <div className="absolute top-[5px] left-[50px] z-20">
            <div className="bg-[#C8913A] rotate-45 w-[80px] h-[80px] flex items-center justify-center rounded">
              <div className="w-[66px] h-[66px] bg-white rounded-full -rotate-45 flex items-center justify-center overflow-hidden">
                {company?.company_logo ? (
                  <img src={company.company_logo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                ) : (
                  <span className="text-[#5C3A21] font-extrabold text-lg">KW</span>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-[10px] left-[145px] right-6 h-[70px] z-10">
            <div className="h-full bg-[#C8913A] p-[3px] rounded-sm">
              <div className="h-full bg-[#5C3A21] flex items-center justify-center px-[30px] rounded-sm">
                <span className="text-white font-bold text-[20px] tracking-[0.8px] text-center leading-[1.3] whitespace-normal break-words max-w-full">
                  {company?.company_name || 'Kassahun Tsegaye Wood and Alu Works Plc'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document info row: title, number, date, status */}
        <div className="mx-8 mt-5 flex items-start justify-between">
          <div>
            <h1 className="text-[#5C3A21] font-extrabold text-xl tracking-tight uppercase">Proforma Invoice</h1>
            <p className="text-gray-900 text-sm font-semibold font-mono mt-1.5">{proforma.proformaNumber}</p>
            <p className="text-gray-500 text-xs mt-0.5">{formatDate(proforma.createdAt)}</p>
          </div>
          <div>
            <StatusBadge status={proforma.status} />
          </div>
        </div>

        {/* Subject title */}
        {proforma.subject && (
          <div className="mx-8 mt-6 text-center">
            <h2 className="text-lg font-bold text-gray-900 uppercase underline underline-offset-4 decoration-gray-900">{proforma.subject}</h2>
          </div>
        )}

        {/* Billed To / Material box */}
        <div className="mx-8 mt-8 inline-block border border-gray-300 rounded">
          <table className="w-auto">
            <tbody>
              <tr>
                <td className="p-4 border-r border-gray-300 align-top">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Billed To</p>
                  <p className="text-sm font-semibold text-gray-900">{proforma.billedToName}</p>
                </td>
                <td className="p-4 align-top max-w-xs">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Material</p>
                  <p className="text-sm text-gray-900 whitespace-normal break-words">{materialSummary || '—'}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Line items table */}
        <div className="mx-8 mt-8">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">Description</th>
                <th className="border border-gray-300 px-4 py-2.5 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wider">Unit</th>
                <th className="border border-gray-300 px-4 py-2.5 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wider">Qty</th>
                <th className="border border-gray-300 px-4 py-2.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider">Rate</th>
                <th className="border border-gray-300 px-4 py-2.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {proforma.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600 text-center">{item.unit}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
              {proforma.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="border border-gray-300 px-4 py-6 text-center text-sm text-gray-400">No items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals box */}
        <div className="mx-8 mt-6 flex justify-end">
          <div className="w-72 border border-gray-300 rounded">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">Subtotal</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(proforma.subtotal)}</td>
                </tr>
                {proforma.discountAmount > 0 && (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">Discount</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-green-600 text-right font-medium">-{formatCurrency(proforma.discountAmount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">VAT ({proforma.vatRate}%)</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(proforma.vatAmount)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-900">TOTAL</td>
                  <td className="border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-900 text-right">{formatCurrency(proforma.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Validity note */}
        <div className="mx-8 mt-6 text-center">
          <p className="text-xs text-gray-500 italic">{validityText}</p>
        </div>

        {/* Signature block */}
        <div className="mx-8 mt-10 mb-4">
          <p className="text-sm text-gray-700">Yours sincerely,</p>
          <p className="text-sm font-semibold text-gray-900 mt-8">{company?.signatory_name || ''}</p>
        </div>

        {/* Footer */}
        {(company?.company_phone || company?.company_email) && (
          <div className="mx-8 mt-8 border-t border-gray-300 pt-3 pb-4 flex justify-center gap-8 text-[11px] text-gray-500">
            {company?.company_phone && <span>Phone: {company.company_phone}</span>}
            {company?.company_email && <span>Email: {company.company_email}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}