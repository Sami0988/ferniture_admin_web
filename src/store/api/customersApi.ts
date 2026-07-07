import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiCustomer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

function buildCustomerFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'image' && value instanceof File) {
      formData.append('image', value);
    } else if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });
  return formData;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedResponse<ApiCustomer>, { page?: number; limit?: number; search?: string; type?: string }>({
      query: (params) => ({
        url: '/customers',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Customer'],
    }),

    searchCustomers: builder.query<ApiResponse<ApiCustomer[]>, string>({
      query: (q) => ({
        url: '/customers/search',
        params: { q },
      }),
      providesTags: ['Customer'],
    }),

    exportCustomers: builder.query<Blob, void>({
      query: () => ({
        url: '/customers/export',
        responseHandler: (res: Response) => res.blob(),
      }),
    }),

    getCustomerById: builder.query<ApiResponse<ApiCustomer>, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
    }),

    createCustomer: builder.mutation<ApiResponse<ApiCustomer>, CreateCustomerRequest>({
      query: (body) => ({
        url: '/customers',
        method: 'POST',
        body: buildCustomerFormData(body),
      }),
      invalidatesTags: ['Customer'],
    }),

    updateCustomer: builder.mutation<ApiResponse<ApiCustomer>, { id: string; data: UpdateCustomerRequest }>({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
        body: buildCustomerFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Customer', id }, 'Customer'],
    }),

    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useSearchCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
