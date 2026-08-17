import { baseApi } from '../baseApi';

export interface GlobalSearchResult {
  customers: Array<{ id: string; fullName: string; phone: string; email: string; tinNumber: string }>;
  suppliers: Array<{ id: string; companyName: string; tinNumber: string; phone: string }>;
  workOrders: Array<{ id: string; projectNumber: string; title: string; clientName: string }>;
  purchases: Array<{ id: string; fsNumber: string; supplierName: string }>;
}

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query<GlobalSearchResult, string>({
      query: (q) => ({
        url: '/search',
        params: { q },
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),
  }),
});

export const { useGlobalSearchQuery } = searchApi;
