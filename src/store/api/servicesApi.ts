import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

function buildServiceFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'mainImage' && value instanceof File) {
      formData.append('mainImage', value);
    } else if (key === 'featureImages' && Array.isArray(value)) {
      value.forEach((file: File) => formData.append('featureImages', file));
    } else if (key === 'bulletPoints' && Array.isArray(value)) {
      formData.append('bulletPoints', JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  return formData;
}

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<
      PaginatedResponse<Service>,
      { page?: number; limit?: number; category?: string; search?: string }
    >({
      query: (params) => ({
        url: '/admin/services',
        params: {
          ...(params.page != null && { page: String(params.page) }),
          ...(params.limit != null && { limit: String(params.limit) }),
          ...(params.category != null && { category: params.category }),
          ...(params.search != null && { search: params.search }),
        },
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Service'],
    }),

    getServiceById: builder.query<ApiResponse<Service>, string>({
      query: (id) => `/admin/services/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Service', id }],
    }),

    createService: builder.mutation<ApiResponse<Service>, CreateServiceRequest>({
      query: (body) => ({
        url: '/admin/services',
        method: 'POST',
        body: buildServiceFormData(body as Record<string, any>),
      }),
      invalidatesTags: ['Service'],
    }),

    updateService: builder.mutation<
      ApiResponse<Service>,
      { id: string; data: UpdateServiceRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/services/${id}`,
        method: 'PATCH',
        body: buildServiceFormData(data as Record<string, any>),
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Service', id }, 'Service'],
    }),

    deleteService: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/services/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Service'],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = servicesApi;
