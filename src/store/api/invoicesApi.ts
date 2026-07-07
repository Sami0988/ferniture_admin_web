import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiInvoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  UpdateInvoiceItemsRequest,
  InvoiceFilters,
  ApiPayment,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<PaginatedResponse<ApiInvoice>, InvoiceFilters>({
      query: (params) => ({
        url: '/invoices',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Invoice'],
    }),

    getInvoiceById: builder.query<ApiResponse<ApiInvoice>, string>({
      query: (id) => `/invoices/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),

    createInvoice: builder.mutation<ApiResponse<ApiInvoice>, CreateInvoiceRequest>({
      query: (body) => ({
        url: '/invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoice', 'Project'],
    }),

    updateInvoice: builder.mutation<ApiResponse<ApiInvoice>, { id: string; data: UpdateInvoiceRequest }>({
      query: ({ id, data }) => ({
        url: `/invoices/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Invoice', id }, 'Invoice'],
    }),

    updateInvoiceItems: builder.mutation<ApiResponse<ApiInvoice>, { id: string; data: UpdateInvoiceItemsRequest }>({
      query: ({ id, data }) => ({
        url: `/invoices/${id}/items`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Invoice', id }, 'Invoice'],
    }),

    getInvoicePayments: builder.query<ApiResponse<ApiPayment[]>, string>({
      query: (id) => `/invoices/${id}/payments`,
      providesTags: ['Payment'],
    }),

    recordPayment: builder.mutation<ApiResponse<ApiPayment>, { id: string; data: { amount: number; method: string; reference?: string; notes?: string } }>({
      query: ({ id, data }) => ({
        url: `/invoices/${id}/payments`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment', 'Invoice'],
    }),

    emailInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/invoices/${id}/email`,
        method: 'POST',
      }),
    }),

    getInvoicePdf: builder.query<Blob, string>({
      query: (id) => ({
        url: `/invoices/${id}/pdf`,
        responseHandler: (res: Response) => res.blob(),
      }),
    }),

    deleteInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoice'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useUpdateInvoiceItemsMutation,
  useGetInvoicePaymentsQuery,
  useRecordPaymentMutation,
  useEmailInvoiceMutation,
  useLazyGetInvoicePdfQuery,
  useDeleteInvoiceMutation,
} = invoicesApi;
