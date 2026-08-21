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
        },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: ['Calendar'],
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
