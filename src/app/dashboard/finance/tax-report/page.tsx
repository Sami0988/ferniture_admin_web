'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGetTaxReportQuery } from '@/store/api/taxReportApi';
import { useAppSelector } from '@/store';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { ReportPeriod, TaxReportResponse } from '@/types/api';
import { Download, FileText, TrendingUp, TrendingDown, Receipt, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const periods: { value: ReportPeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

export default function TaxReportPage() {
  const router = useRouter();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('month');
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const queryParams = useMemo(() => {
    const params: { period: ReportPeriod; referenceDate?: string; from?: string; to?: string } = {
      period: activePeriod,
    };
    if (activePeriod !== 'custom') {
      params.referenceDate = referenceDate;
    } else {
      if (customFrom) params.from = customFrom;
      if (customTo) params.to = customTo;
    }
    return params;
  }, [activePeriod, referenceDate, customFrom, customTo]);

  const { data: report, isLoading, error } = useGetTaxReportQuery(queryParams);

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    const baseParams = new URLSearchParams();
    baseParams.set('period', activePeriod);
    if (activePeriod !== 'custom' && referenceDate) {
      baseParams.set('referenceDate', referenceDate);
    } else {
      if (customFrom) baseParams.set('from', customFrom);
      if (customTo) baseParams.set('to', customTo);
    }
    baseParams.set('format', format);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1'}/tax-report/export?${baseParams.toString()}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      const filename = disposition?.match(/filename="?([^";\s]+)"?/)?.[1] || `tax-report.${format}`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export report');
    }
  };

  const getNetVatCardStyle = (status: TaxReportResponse['vatSummary']['status']) => {
    if (status === 'PAYABLE_TO_GOVERNMENT') {
      return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
    }
    return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
  };

  const getNetVatTextStyle = (status: TaxReportResponse['vatSummary']['status']) => {
    if (status === 'PAYABLE_TO_GOVERNMENT') {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-green-600 dark:text-green-400';
  };

  const getNetVatIcon = (status: TaxReportResponse['vatSummary']['status']) => {
    if (status === 'PAYABLE_TO_GOVERNMENT') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getNetVatLabel = (status: TaxReportResponse['vatSummary']['status']) => {
    if (status === 'PAYABLE_TO_GOVERNMENT') {
      return 'You owe the government';
    }
    return 'Government owes you';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tax Report</h1>
          <p className="text-sm text-muted">
            {report?.period?.label || 'Select a period to view the report'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
            <Download className="h-4 w-4 mr-1.5" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setActivePeriod(p.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activePeriod === p.value
                ? 'bg-brand-gold text-white'
                : 'bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-hover'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activePeriod !== 'custom' && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted">Reference Date</label>
          <input
            type="date"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          />
        </div>
      )}

      {activePeriod === 'custom' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card>
          <div className="py-12 text-center text-sm text-muted">
            Failed to load tax report. Please try again.
          </div>
        </Card>
      )}

      {!isLoading && !error && report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <TrendingUp className="h-4 w-4" />
                  Output VAT (Sales)
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(report.vatSummary?.outputVat ?? 0)}
                </p>
                <p className="text-xs text-muted">
                  From {report.workProjects?.count ?? 0} project(s)
                </p>
              </div>
            </Card>

            <Card>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <TrendingDown className="h-4 w-4" />
                  Input VAT (Purchases)
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(report.vatSummary?.inputVat ?? 0)}
                </p>
                <p className="text-xs text-muted">
                  From {report.purchases?.count ?? 0} purchase(s)
                </p>
              </div>
            </Card>

            <div className={cn('rounded-xl border p-5 space-y-2', getNetVatCardStyle(report.vatSummary?.status))}>
              <div className="flex items-center gap-2 text-sm text-muted">
                {getNetVatIcon(report.vatSummary?.status)}
                Net VAT
              </div>
              <p className={cn('text-2xl font-bold', getNetVatTextStyle(report.vatSummary?.status))}>
                {formatCurrency(report.vatSummary?.netVat ?? 0)}
              </p>
              <p className={cn('text-xs font-medium', getNetVatTextStyle(report.vatSummary?.status))}>
                {getNetVatLabel(report.vatSummary?.status)}
              </p>
            </div>

            <Card>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Receipt className="h-4 w-4" />
                  Withholding Tax
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(report.withholdingSummary?.totalWithheld ?? 0)}
                </p>
                <p className="text-xs text-muted">
                  Reported separately, not part of VAT balance
                </p>
              </div>
            </Card>
          </div>

          {(report.breakdown?.purchases?.length ?? 0) === 0 && (report.breakdown?.workProjects?.length ?? 0) === 0 && (
            <Card>
              <div className="py-12 text-center text-sm text-muted">
                No purchases or projects recorded in this period.
              </div>
            </Card>
          )}

          {(report.breakdown?.purchases?.length ?? 0) > 0 && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-muted" />
                  Purchases in Period ({report.breakdown?.purchases?.length ?? 0})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Supplier</th>
                        <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">FS Number</th>
                        <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Before VAT</th>
                        <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">VAT</th>
                        <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Withholding</th>
                        <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(report.breakdown?.purchases ?? []).map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-surface-hover/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/purchases/records/${item.id}`)}
                        >
                          <td className="py-3 text-sm text-muted">{formatDate(item.purchaseDate)}</td>
                          <td className="py-3 text-sm font-medium text-foreground">{item.supplierName || '—'}</td>
                          <td className="py-3 text-sm text-muted font-mono">{item.fsNumber}</td>
                          <td className="py-3 text-sm text-right">{formatCurrency(item.amountBeforeVat)}</td>
                          <td className="py-3 text-sm text-right">{formatCurrency(item.vatAmount)}</td>
                          <td className="py-3 text-sm text-right">{formatCurrency(item.withholdingAmount)}</td>
                          <td className="py-3 text-sm text-right font-medium">{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {(report.breakdown?.workProjects?.length ?? 0) > 0 && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-muted" />
                  Work Projects in Period ({report.breakdown?.workProjects?.length ?? 0})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Project</th>
                        <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Client</th>
                        <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Before VAT</th>
                        <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">VAT</th>
                        <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(report.breakdown?.workProjects ?? []).map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-surface-hover/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/workorders/${item.id}`)}
                        >
                          <td className="py-3 text-sm text-muted">{formatDate(item.projectDate)}</td>
                          <td className="py-3 text-sm font-medium text-foreground">{item.projectName}</td>
                          <td className="py-3 text-sm text-muted">{item.clientName || '—'}</td>
                          <td className="py-3 text-sm text-right">{formatCurrency(item.priceBeforeVat)}</td>
                          <td className="py-3 text-sm text-right">{formatCurrency(item.vatAmount)}</td>
                          <td className="py-3 text-sm text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
}
