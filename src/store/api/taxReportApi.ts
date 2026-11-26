import { baseApi } from '../baseApi';
import type { TaxReportResponse, TaxReportQuery } from '@/types/api';

export const taxReportApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getTaxReport: builder.query<TaxReportResponse, TaxReportQuery>({
      query: (params) => ({
        url: '/tax-report',
        params: {
          period: params.period,
          ...(params.referenceDate != null && { referenceDate: params.referenceDate }),
          ...(params.from != null && { from: params.from }),
          ...(params.to != null && { to: params.to }),
          ...(params.fiscalYear != null && { fiscalYear: String(params.fiscalYear) }),
          ...(params.fiscalMonth != null && { fiscalMonth: String(params.fiscalMonth) }),
          ...(params.quarter != null && { quarter: String(params.quarter) }),
          ...(params.purchasePage != null && { purchasePage: String(params.purchasePage) }),
          ...(params.purchaseLimit != null && { purchaseLimit: String(params.purchaseLimit) }),
          ...(params.projectPage != null && { projectPage: String(params.projectPage) }),
          ...(params.projectLimit != null && { projectLimit: String(params.projectLimit) }),
        },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      // Refetch when the records the report is built from change
      providesTags: ['Calendar', 'Purchase', 'Project'],
    }),
    exportTaxReport: builder.query<Blob, { params: Record<string, string> }>({
      query: ({ params }) => ({
        url: '/tax-report/export',
        params,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),
  }),
});

export const { useGetTaxReportQuery, useLazyExportTaxReportQuery } = taxReportApi;
