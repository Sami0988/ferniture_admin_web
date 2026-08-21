import { baseApi } from '../baseApi';
import type { TaxReportResponse, TaxReportQuery } from '@/types/api';

export const taxReportApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getTaxReport: builder.query<TaxReportResponse, TaxReportQuery>({
      query: (params) => ({
        url: '/tax-report',
        params,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: ['Calendar'],
    }),
    exportTaxReport: builder.query<Blob, { params: Record<string, string> }>({
      query: ({ params }) => ({
        url: '/tax-report/export',
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const { useGetTaxReportQuery, useLazyExportTaxReportQuery } = taxReportApi;
