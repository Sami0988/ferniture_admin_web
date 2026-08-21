import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiSupplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<PaginatedResponse<ApiSupplier>, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/suppliers',
        params: {
          ...(params.page != null && { page: String(params.page) }),
          ...(params.limit != null && { limit: String(params.limit) }),
          ...(params.search != null && { search: params.search }),
        },
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Supplier'],
    }),

    searchSuppliers: builder.query<Pick<ApiSupplier, 'id' | 'companyName' | 'tinNumber' | 'phone' | 'address'>[], string>({
      query: (q) => ({
        url: '/suppliers/search',
        params: { q },
      }),
      transformResponse: (response: any) => {
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      providesTags: ['Supplier'],
    }),

    getSupplierById: builder.query<ApiResponse<ApiSupplier>, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Supplier', id }],
    }),

    createSupplier: builder.mutation<ApiResponse<ApiSupplier>, CreateSupplierRequest>({
      query: (body) => ({
        url: '/suppliers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Supplier'],
    }),

    updateSupplier: builder.mutation<ApiResponse<ApiSupplier>, { id: string; data: UpdateSupplierRequest }>({
      query: ({ id, data }) => ({
        url: `/suppliers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Supplier', id }, 'Supplier'],
    }),

    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Supplier'],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useSearchSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = suppliersApi;
