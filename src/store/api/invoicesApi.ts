import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiInvoice,
  CreateInvoiceRequest,
  CreateInvoiceFromProjectRequest,
  UpdateInvoiceRequest,
  UpdateInvoiceItemsRequest,
  InvoiceFilters,
  RecordInvoicePaymentRequest,
  RecordInvoicePaymentResponse,
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

    createInvoiceFromProject: builder.mutation<ApiResponse<ApiInvoice>, string>({
      query: (projectId) => ({
        url: `/invoices/from-project/${projectId}`,
        method: 'POST',
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

    recordInvoicePayment: builder.mutation<ApiResponse<RecordInvoicePaymentResponse>, { id: string; data: RecordInvoicePaymentRequest }>({
      query: ({ id, data }) => ({
        url: `/invoices/${id}/payments`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Invoice', id }, 'Invoice', 'Project'],
    }),

    emailInvoice: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/invoices/${id}/email`,
        method: 'POST',
      }),
    }),

    getInvoicePdf: builder.query<ApiResponse<{ pdfUrl: string }>, string>({
      query: (id) => `/invoices/${id}/pdf`,
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
  useCreateInvoiceFromProjectMutation,
  useUpdateInvoiceMutation,
  useUpdateInvoiceItemsMutation,
  useRecordInvoicePaymentMutation,
  useEmailInvoiceMutation,
  useLazyGetInvoicePdfQuery,
  useDeleteInvoiceMutation,
} = invoicesApi;
