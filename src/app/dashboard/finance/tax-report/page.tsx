'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetTaxReportQuery, useLazyExportTaxReportQuery } from '@/store/api/taxReportApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useUI } from '@/hooks/useStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { ReportPeriod, TaxReportResponse } from '@/types/api';
import { Download, FileText, TrendingUp, TrendingDown, Receipt, Building2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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

const FISCAL_MONTHS = [
  { value: 1, label: 'Hamle', caption: '1–30' },
  { value: 2, label: 'Nehase–Pagume', caption: 'Nehase 1 – Pagume 6' },
  { value: 3, label: 'Meskerem', caption: '1–30' },
  { value: 4, label: 'Tikimt', caption: '1–30' },
  { value: 5, label: 'Hidar', caption: '1–30' },
  { value: 6, label: 'Tahsas', caption: '1–30' },
  { value: 7, label: 'Tir', caption: '1–30' },
  { value: 8, label: 'Yekatit', caption: '1–30' },
  { value: 9, label: 'Megabit', caption: '1–30' },
  { value: 10, label: 'Miazia', caption: '1–30' },
  { value: 11, label: 'Genbot', caption: '1–30' },
  { value: 12, label: 'Sene', caption: '1–30' },
];

const FISCAL_QUARTERS = [
  { value: 1, label: 'Q1 (Hamle – Meskerem)' },
  { value: 2, label: 'Q2 (Tikimt – Tahsas)' },
  { value: 3, label: 'Q3 (Tir – Megabit)' },
  { value: 4, label: 'Q4 (Miazia – Sene)' },
];

function getCurrentFiscalMonth(): number {
  const now = new Date();
  const gy = now.getFullYear();
  const gm = now.getMonth() + 1;
  const gd = now.getDate();
  const monthLengths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  if (isLeap) monthLengths[2] = 29;
  let dayOfYear = gd;
  for (let i = 1; i < gm; i++) dayOfYear += monthLengths[i];
  const ethNewYearDay = isLeap ? 255 : 254;
  let ethYear: number;
  let ethDayOfYear: number;
  if (dayOfYear >= ethNewYearDay) {
    ethYear = gy - 7;
    ethDayOfYear = dayOfYear - ethNewYearDay;
  } else {
    ethYear = gy - 8;
    const prevLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || (gy - 1) % 400 === 0;
    const prevYearDays = prevLeap ? 366 : 365;
    const prevEthNewYearDay = prevLeap ? 255 : 254;
    ethDayOfYear = prevYearDays - prevEthNewYearDay + dayOfYear;
  }
  const ethMonth = Math.floor(ethDayOfYear / 30);
  let fiscalMonthIndex: number;
  if (ethMonth >= 10) {
    fiscalMonthIndex = ethMonth === 10 ? 0 : 1;
  } else {
    fiscalMonthIndex = ethMonth + 2;
  }
  return fiscalMonthIndex + 1;
}

function getCurrentFiscalYear(): number {
  const now = new Date();
  const gy = now.getFullYear();
  const gm = now.getMonth() + 1;
  const gd = now.getDate();
  const monthLengths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  if (isLeap) monthLengths[2] = 29;
  let dayOfYear = gd;
  for (let i = 1; i < gm; i++) dayOfYear += monthLengths[i];
  const ethNewYearDay = isLeap ? 255 : 254;
  let ethYear: number;
  if (dayOfYear >= ethNewYearDay) {
    ethYear = gy - 7;
  } else {
    ethYear = gy - 8;
  }
  const fiscalMonth = getCurrentFiscalMonth();
  if (fiscalMonth === 1) return ethYear - 1;
  return ethYear;
}

function getCurrentFiscalQuarter(): number {
  const m = getCurrentFiscalMonth();
  if (m <= 3) return 1;
  if (m <= 6) return 2;
  if (m <= 9) return 3;
  return 4;
}

export default function TaxReportPage() {
  const router = useRouter();
  const { calendar } = useUI();
  const [triggerExport] = useLazyExportTaxReportQuery();
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('month');
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [fiscalMonth, setFiscalMonth] = useState<number>(getCurrentFiscalMonth());
  const [fiscalQuarter, setFiscalQuarter] = useState<number>(getCurrentFiscalQuarter());
  const [fiscalYear, setFiscalYear] = useState<number>(getCurrentFiscalYear());

  const isFiscal = calendar === 'ec-fiscal';

  useEffect(() => {
    if (isFiscal && activePeriod === 'custom') {
      setActivePeriod('month');
    }
    setFiscalMonth(getCurrentFiscalMonth());
    setFiscalQuarter(getCurrentFiscalQuarter());
    setFiscalYear(getCurrentFiscalYear());
    setReferenceDate(new Date().toISOString().split('T')[0]);
  }, [calendar]);

  const queryParams = useMemo(() => {
    const params: {
      period: ReportPeriod;
      referenceDate?: string;
      from?: string;
      to?: string;
      fiscalYear?: number;
      fiscalMonth?: number;
      quarter?: number;
    } = { period: activePeriod };

    if (isFiscal) {
      if (activePeriod === 'month') {
        params.fiscalYear = fiscalYear;
        params.fiscalMonth = fiscalMonth;
      } else if (activePeriod === 'quarter') {
        params.fiscalYear = fiscalYear;
        params.quarter = fiscalQuarter;
      } else if (activePeriod === 'year') {
        params.fiscalYear = fiscalYear;
      } else {
        if (activePeriod === 'custom') {
          if (customFrom) params.from = customFrom;
          if (customTo) params.to = customTo;
        } else {
          params.referenceDate = referenceDate;
        }
      }
    } else {
      if (activePeriod !== 'custom') {
        params.referenceDate = referenceDate;
      } else {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      }
    }
    return params;
  }, [activePeriod, referenceDate, customFrom, customTo, fiscalMonth, fiscalQuarter, fiscalYear, isFiscal]);

  const { data: report, isLoading, isFetching, error } = useGetTaxReportQuery(queryParams);

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    const params: Record<string, string> = { period: activePeriod, format };
    if (isFiscal) {
      if (activePeriod === 'month') {
        params.fiscalYear = String(fiscalYear);
        params.fiscalMonth = String(fiscalMonth);
      } else if (activePeriod === 'quarter') {
        params.fiscalYear = String(fiscalYear);
        params.quarter = String(fiscalQuarter);
      } else if (activePeriod === 'year') {
        params.fiscalYear = String(fiscalYear);
      } else if (activePeriod === 'custom') {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      } else {
        params.referenceDate = referenceDate;
      }
    } else {
      if (activePeriod !== 'custom' && referenceDate) {
        params.referenceDate = referenceDate;
      } else {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      }
    }

    try {
      const result = await triggerExport({ params }).unwrap();
      const blob = result as unknown as Blob;
      const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tax-report.${ext}`;
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
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} disabled={isFetching}>
            <Download className="h-4 w-4 mr-1.5" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isFetching}>
            <FileText className="h-4 w-4 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {periods.map((p) => {
          if (isFiscal && p.value === 'custom') return null;
          return (
            <button
              key={p.value}
              onClick={() => setActivePeriod(p.value)}
              disabled={isFetching}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                activePeriod === p.value
                  ? 'bg-brand-gold text-white'
                  : 'bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-hover'
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {isFiscal && (activePeriod === 'month' || activePeriod === 'quarter' || activePeriod === 'year') && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Fiscal Year</label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              disabled={isFetching}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold disabled:opacity-50"
            >
              {[0, 1, 2, 3, 4].map((offset) => {
                const fy = getCurrentFiscalYear() - offset;
                return (
                  <option key={fy} value={fy}>
                    {fy}/{fy + 1}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-muted">Hamle {fiscalYear} – Sene {fiscalYear + 1}</p>
          </div>

          {activePeriod === 'month' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Fiscal Month</label>
              <select
                value={fiscalMonth}
                onChange={(e) => setFiscalMonth(Number(e.target.value))}
                disabled={isFetching}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold disabled:opacity-50"
              >
                {FISCAL_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} · {m.caption}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activePeriod === 'quarter' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Fiscal Quarter</label>
              <select
                value={fiscalQuarter}
                onChange={(e) => setFiscalQuarter(Number(e.target.value))}
                disabled={isFetching}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold disabled:opacity-50"
              >
                {FISCAL_QUARTERS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {!isFiscal && activePeriod !== 'custom' && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted">Reference Date</label>
          <div>
            <input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              disabled={isFetching}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
            {calendar === 'ec' && (
              <p className="text-xs text-brand-gold mt-1">{formatDate(referenceDate)}</p>
            )}
          </div>
        </div>
      )}

      {!isFiscal && activePeriod === 'custom' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">From</label>
            <div>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                disabled={isFetching}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-50"
              />
              {calendar === 'ec' && (
                <p className="text-xs text-brand-gold mt-1">{formatDate(customFrom)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">To</label>
            <div>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                disabled={isFetching}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-50"
              />
              {calendar === 'ec' && (
                <p className="text-xs text-brand-gold mt-1">{formatDate(customTo)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isFiscal && (activePeriod === 'day' || activePeriod === 'week') && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted">Reference Date</label>
          <div>
            <input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              disabled={isFetching}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
            <p className="text-xs text-brand-gold mt-1">{formatDate(referenceDate)}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
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
        <div className="relative">
          {isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-5 w-5 animate-spin text-brand-gold" />
                Loading report...
              </div>
            </div>
          )}
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
                {report.workProjects?.message || 'No purchases or projects recorded in this period.'}
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
                          <td className="py-3 text-sm text-muted">{formatDate(item.purchaseDateGC || item.purchaseDate)}</td>
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
                          <td className="py-3 text-sm text-muted">{formatDate(item.paidAtGC || item.paidAt)}</td>
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

          {report.workProjects?.count === 0 && report.workProjects?.message && (report.breakdown?.purchases?.length ?? 0) > 0 && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-muted" />
                  Work Projects in Period (0)
                </div>
                <p className="text-sm text-muted">{report.workProjects.message}</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  );
}
