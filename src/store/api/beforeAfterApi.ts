import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  BeforeAfterPair,
  CreateBeforeAfterRequest,
  UpdateBeforeAfterRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

function buildBeforeAfterFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'beforeImage' && value instanceof File) {
      formData.append('beforeImage', value);
    } else if (key === 'afterImage' && value instanceof File) {
      formData.append('afterImage', value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  });
  return formData;
}

export const beforeAfterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBeforeAfterPairs: builder.query<
      PaginatedResponse<BeforeAfterPair>,
      { page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/admin/before-after',
        params: {
          ...(params.page != null && { page: String(params.page) }),
          ...(params.limit != null && { limit: String(params.limit) }),
        },
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['BeforeAfter'],
    }),

    getBeforeAfterById: builder.query<ApiResponse<BeforeAfterPair>, string>({
      query: (id) => `/admin/before-after/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'BeforeAfter', id }],
    }),

    createBeforeAfterPair: builder.mutation<ApiResponse<BeforeAfterPair>, CreateBeforeAfterRequest>({
      query: (body) => ({
        url: '/admin/before-after',
        method: 'POST',
        body: buildBeforeAfterFormData(body as Record<string, any>),
      }),
      invalidatesTags: ['BeforeAfter'],
    }),

    updateBeforeAfterPair: builder.mutation<
      ApiResponse<BeforeAfterPair>,
      { id: string; data: UpdateBeforeAfterRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/before-after/${id}`,
        method: 'PATCH',
        body: buildBeforeAfterFormData(data as Record<string, any>),
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'BeforeAfter', id }, 'BeforeAfter'],
    }),

    deleteBeforeAfterPair: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/before-after/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BeforeAfter'],
    }),
  }),
});

export const {
  useGetBeforeAfterPairsQuery,
  useGetBeforeAfterByIdQuery,
  useCreateBeforeAfterPairMutation,
  useUpdateBeforeAfterPairMutation,
  useDeleteBeforeAfterPairMutation,
} = beforeAfterApi;
