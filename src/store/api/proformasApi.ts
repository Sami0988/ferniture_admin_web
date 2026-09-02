import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  Proforma,
  ProformaStatus,
  CreateProformaRequest,
  UpdateProformaRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

interface ProformaListQuery {
  status?: ProformaStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const proformasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProformas: builder.query<PaginatedResponse<Proforma>, ProformaListQuery>({
      query: (params) => ({
        url: '/proformas',
        params: {
          ...(params.page != null && { page: String(params.page) }),
          ...(params.limit != null && { limit: String(params.limit) }),
          ...(params.status != null && { status: params.status }),
          ...(params.search != null && { search: params.search }),
          ...(params.dateFrom != null && { dateFrom: params.dateFrom }),
          ...(params.dateTo != null && { dateTo: params.dateTo }),
        },
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Proforma'],
    }),

    getProforma: builder.query<ApiResponse<Proforma>, string>({
      query: (id) => ({ url: `/proformas/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Proforma', id }],
    }),

    getProformaPdf: builder.query<Blob, string>({
      query: (id) => ({
        url: `/proformas/${id}/pdf`,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    createProforma: builder.mutation<ApiResponse<Proforma>, CreateProformaRequest>({
      query: (body) => ({
        url: '/proformas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Proforma'],
    }),

    updateProforma: builder.mutation<ApiResponse<Proforma>, { id: string; body: UpdateProformaRequest }>({
      query: ({ id, body }) => ({
        url: `/proformas/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Proforma', id }, 'Proforma'],
    }),

    deleteProforma: builder.mutation<void, string>({
      query: (id) => ({
        url: `/proformas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Proforma'],
    }),

    sendProforma: builder.mutation<ApiResponse<Proforma>, string>({
      query: (id) => ({
        url: `/proformas/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Proforma', id }, 'Proforma'],
    }),

    acceptProforma: builder.mutation<ApiResponse<Proforma>, string>({
      query: (id) => ({
        url: `/proformas/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Proforma', id }, 'Proforma'],
    }),

    cancelProforma: builder.mutation<ApiResponse<Proforma>, string>({
      query: (id) => ({
        url: `/proformas/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Proforma', id }, 'Proforma'],
    }),
  }),
});

export const {
  useGetProformasQuery,
  useGetProformaQuery,
  useLazyGetProformaQuery,
  useLazyGetProformaPdfQuery,
  useCreateProformaMutation,
  useUpdateProformaMutation,
  useDeleteProformaMutation,
  useSendProformaMutation,
  useAcceptProformaMutation,
  useCancelProformaMutation,
} = proformasApi;
