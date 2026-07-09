import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiPaymentLetter,
  CreatePaymentLetterRequest,
  UpdatePaymentLetterRequest,
  PaymentLetterFilters,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const paymentLettersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentLetters: builder.query<PaginatedResponse<ApiPaymentLetter>, PaymentLetterFilters>({
      query: (params) => ({
        url: '/payment-letters',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['PaymentLetter'],
    }),

    getPaymentLetterById: builder.query<ApiResponse<ApiPaymentLetter>, string>({
      query: (id) => `/payment-letters/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'PaymentLetter', id }],
    }),

    createPaymentLetter: builder.mutation<ApiResponse<ApiPaymentLetter>, CreatePaymentLetterRequest>({
      query: (body) => ({
        url: '/payment-letters',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentLetter'],
    }),

    updatePaymentLetter: builder.mutation<ApiResponse<ApiPaymentLetter>, { id: string; data: UpdatePaymentLetterRequest }>({
      query: ({ id, data }) => ({
        url: `/payment-letters/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'PaymentLetter', id }, 'PaymentLetter'],
    }),

    sendPaymentLetter: builder.mutation<ApiResponse<ApiPaymentLetter>, string>({
      query: (id) => ({
        url: `/payment-letters/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'PaymentLetter', id }, 'PaymentLetter'],
    }),

    deletePaymentLetter: builder.mutation<void, string>({
      query: (id) => ({
        url: `/payment-letters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentLetter'],
    }),
  }),
});

export const {
  useGetPaymentLettersQuery,
  useGetPaymentLetterByIdQuery,
  useCreatePaymentLetterMutation,
  useUpdatePaymentLetterMutation,
  useSendPaymentLetterMutation,
  useDeletePaymentLetterMutation,
} = paymentLettersApi;
