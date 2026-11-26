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
import { Download, FileText, TrendingUp, TrendingDown, Receipt, Building2, AlertCircle, CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Kenat from 'kenat';

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

function getLocalDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PAGE_SIZE = 15;

function getCurrentFiscalMonth(): number {
  const now = new Date();
  const ec = new Kenat(now).getEthiopian();
  const ethMonthIndex = ec.month - 1;
  if (ethMonthIndex === 10) return 1;
  if (ethMonthIndex === 11 || ethMonthIndex === 12) return 2;
  return ethMonthIndex + 3;
}

function getCurrentFiscalYear(): number {
  const now = new Date();
  const ec = new Kenat(now).getEthiopian();
  const ethMonthIndex = ec.month - 1;
  if (ethMonthIndex < 10) return ec.year - 1;
  return ec.year;
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
  const [referenceDate, setReferenceDate] = useState(() => getLocalDateString());
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [fiscalMonth, setFiscalMonth] = useState<number>(getCurrentFiscalMonth());
  const [fiscalQuarter, setFiscalQuarter] = useState<number>(getCurrentFiscalQuarter());
  const [fiscalYear, setFiscalYear] = useState<number>(getCurrentFiscalYear());
  // Pages are tied to the filters they were chosen for, so changing the
  // period/date falls back to page 1 without an extra request.
  const [pages, setPages] = useState({ key: '', purchase: 1, project: 1 });

  const isFiscal = calendar === 'ec-fiscal';

  useEffect(() => {
    if (isFiscal && activePeriod === 'custom') {
      setActivePeriod('month');
    }
    setFiscalMonth(getCurrentFiscalMonth());
    setFiscalQuarter(getCurrentFiscalQuarter());
    setFiscalYear(getCurrentFiscalYear());
    setReferenceDate(getLocalDateString());
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

  const filterKey = JSON.stringify(queryParams);
  const purchasePage = pages.key === filterKey ? pages.purchase : 1;
  const projectPage = pages.key === filterKey ? pages.project : 1;

  // A custom range needs both dates, in order, before it can be requested.
  const customRangeHint =
    activePeriod !== 'custom'
      ? null
      : !customFrom || !customTo
        ? 'Select both a From and a To date to view the report.'
        : customFrom > customTo
          ? 'The From date must be on or before the To date.'
          : null;

  const {
    data: fetchedReport,
    isLoading,
    isFetching,
    error,
  } = useGetTaxReportQuery(
    {
      ...queryParams,
      purchasePage,
      purchaseLimit: PAGE_SIZE,
      projectPage,
      projectLimit: PAGE_SIZE,
    },
    { skip: !!customRangeHint },
  );
  const report = customRangeHint ? undefined : fetchedReport;

  // The server returns one page of each list plus its pagination info.
  const purchases = report?.breakdown?.purchases ?? [];
  const workProjects = report?.breakdown?.workProjects ?? [];
  const purchasePagination = report?.breakdown?.pagination?.purchases;
  const projectPagination = report?.breakdown?.pagination?.workProjects;
  const purchaseTotal = purchasePagination?.total ?? report?.purchases?.count ?? purchases.length;
  const projectTotal = projectPagination?.total ?? report?.workProjects?.count ?? workProjects.length;
  const purchaseTotalPages = purchasePagination?.totalPages ?? 1;
  const projectTotalPages = projectPagination?.totalPages ?? 1;
  const safePurchasePage = purchasePagination?.page ?? purchasePage;
  const safeProjectPage = projectPagination?.page ?? projectPage;
  const purchasePageSize = purchasePagination?.limit ?? PAGE_SIZE;
  const projectPageSize = projectPagination?.limit ?? PAGE_SIZE;

  const goToPurchasePage = (page: number) =>
    setPages({ key: filterKey, purchase: page, project: projectPage });
  const goToProjectPage = (page: number) =>
    setPages({ key: filterKey, purchase: purchasePage, project: page });

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
      const range = report?.period
        ? `-${report.period.from}-to-${report.period.to}`.replace(/[^\w-]+/g, '-')
        : '';
      a.download = `tax-report${range}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export report');
    }
  };

  type VatSummary = TaxReportResponse['vatSummary'] | undefined;
  const isVatZero = (summary: VatSummary) => (summary?.netVat ?? 0) === 0;
  const owesVat = (summary: VatSummary) =>
    summary?.status === 'PAYABLE_TO_GOVERNMENT' && !isVatZero(summary);

  const getNetVatCardStyle = (summary: VatSummary) =>
    owesVat(summary)
      ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
      : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';

  const getNetVatTextStyle = (summary: VatSummary) =>
    owesVat(summary) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';

  const getNetVatIcon = (summary: VatSummary) =>
    owesVat(summary) ? (
      <AlertCircle className="h-5 w-5 text-red-500" />
    ) : (
      <CheckCircle className="h-5 w-5 text-green-500" />
    );

  const getNetVatLabel = (summary: VatSummary) => {
    if (isVatZero(summary)) return 'No VAT due';
    return owesVat(summary) ? 'You owe the government' : 'Government owes you';
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
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} disabled={isFetching || !!customRangeHint}>
            <Download className="h-4 w-4 mr-1.5" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isFetching || !!customRangeHint}>
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
              {Array.from({ length: 10 }, (_, offset) => offset).map((offset) => {
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

      {customRangeHint && (
        <Card>
          <div className="py-12 text-center text-sm text-muted">{customRangeHint}</div>
        </Card>
      )}

      {!customRangeHint && isLoading && (
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

      {!customRangeHint && !isLoading && error && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <TrendingDown className="h-4 w-4" />
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
                  <TrendingUp className="h-4 w-4" />
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

            <div className={cn('rounded-xl border p-5 space-y-2', getNetVatCardStyle(report.vatSummary))}>
              <div className="flex items-center gap-2 text-sm text-muted">
                {getNetVatIcon(report.vatSummary)}
                Net VAT
              </div>
              <p className={cn('text-2xl font-bold', getNetVatTextStyle(report.vatSummary))}>
                {formatCurrency(report.vatSummary?.netVat ?? 0)}
              </p>
              <p className={cn('text-xs font-medium', getNetVatTextStyle(report.vatSummary))}>
                {getNetVatLabel(report.vatSummary)}
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
            <Card className="mt-6">
              <div className="py-12 text-center text-sm text-muted">
                {report.workProjects?.message || 'No purchases or projects recorded in this period.'}
              </div>
            </Card>
          )}

          {(report.breakdown?.purchases?.length ?? 0) > 0 && (
            <Card className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-muted" />
                  Purchases in Period ({purchaseTotal})
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
                      {purchases.map((item) => (
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
                {purchaseTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm text-muted">
                      Showing {(safePurchasePage - 1) * purchasePageSize + 1}–{Math.min(safePurchasePage * purchasePageSize, purchaseTotal)} of {purchaseTotal}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPurchasePage(Math.max(1, safePurchasePage - 1))}
                        disabled={isFetching || safePurchasePage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPurchasePage(Math.min(purchaseTotalPages, safePurchasePage + 1))}
                        disabled={isFetching || safePurchasePage >= purchaseTotalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {(report.breakdown?.workProjects?.length ?? 0) > 0 && (
            <Card className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-muted" />
                  Work Projects in Period ({projectTotal})
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
                      {workProjects.map((item) => (
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
                {projectTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm text-muted">
                      Showing {(safeProjectPage - 1) * projectPageSize + 1}–{Math.min(safeProjectPage * projectPageSize, projectTotal)} of {projectTotal}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToProjectPage(Math.max(1, safeProjectPage - 1))}
                        disabled={isFetching || safeProjectPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToProjectPage(Math.min(projectTotalPages, safeProjectPage + 1))}
                        disabled={isFetching || safeProjectPage >= projectTotalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {report.workProjects?.count === 0 && report.workProjects?.message && (report.breakdown?.purchases?.length ?? 0) > 0 && (
            <Card className="mt-6">
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
