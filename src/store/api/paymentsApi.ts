import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiPayment,
  RecordPaymentRequest,
  PaymentFilters,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<PaginatedResponse<ApiPayment>, PaymentFilters>({
      query: (params) => ({
        url: '/payments',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Payment'],
    }),

    getPaymentById: builder.query<ApiResponse<ApiPayment>, string>({
      query: (id) => `/payments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Payment', id }],
    }),

    createPayment: builder.mutation<ApiResponse<ApiPayment>, RecordPaymentRequest>({
      query: (body) => ({
        url: '/payments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payment', 'Invoice'],
    }),

    verifyPayment: builder.mutation<ApiResponse<ApiPayment>, string>({
      query: (id) => ({
        url: `/payments/${id}/verify`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Payment', id }, 'Payment'],
    }),

    deletePayment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Payment', 'Invoice'],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useCreatePaymentMutation,
  useVerifyPaymentMutation,
  useDeletePaymentMutation,
} = paymentsApi;
