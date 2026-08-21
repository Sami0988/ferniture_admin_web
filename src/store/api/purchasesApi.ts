import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiPurchase,
  ApiPurchaseDetail,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const purchasesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchases: builder.query<PaginatedResponse<ApiPurchase>, { page?: number; limit?: number; supplierId?: string; from?: string; to?: string }>({
      query: (params) => ({
        url: '/purchases',
        params: {
          ...(params.page != null && { page: String(params.page) }),
          ...(params.limit != null && { limit: String(params.limit) }),
          ...(params.supplierId != null && { supplierId: params.supplierId }),
          ...(params.from != null && { from: params.from }),
          ...(params.to != null && { to: params.to }),
        },
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Purchase', 'Calendar'],
    }),

    getPurchaseById: builder.query<ApiResponse<ApiPurchaseDetail>, string>({
      query: (id) => ({ url: `/purchases/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Purchase', id }, 'Calendar'],
    }),

    createPurchase: builder.mutation<ApiResponse<ApiPurchase>, CreatePurchaseRequest>({
      query: (body) => ({
        url: '/purchases',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Purchase'],
    }),

    updatePurchase: builder.mutation<ApiResponse<ApiPurchase>, { id: string; data: UpdatePurchaseRequest }>({
      query: ({ id, data }) => ({
        url: `/purchases/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Purchase', id }, 'Purchase'],
    }),

    deletePurchase: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchases/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Purchase'],
    }),
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseByIdQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
} = purchasesApi;
