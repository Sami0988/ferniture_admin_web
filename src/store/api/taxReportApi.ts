import { baseApi } from '../baseApi';
import type { TaxReportResponse, TaxReportQuery } from '@/types/api';

export const taxReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaxReport: builder.query<TaxReportResponse, TaxReportQuery>({
      query: (params) => ({
        url: '/tax-report',
        params,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),
  }),
});

export const { useGetTaxReportQuery } = taxReportApi;
