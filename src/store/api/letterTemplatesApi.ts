import { baseApi } from '../baseApi';
import type {
  ApiLetterTemplate,
  CreateLetterTemplateRequest,
  UpdateLetterTemplateRequest,
  ApiResponse,
} from '@/types/api';

export const letterTemplatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLetterTemplates: builder.query<ApiResponse<ApiLetterTemplate[]>, void>({
      query: () => '/letter-templates',
      providesTags: ['LetterTemplate'],
    }),

    getLetterTemplateById: builder.query<ApiResponse<ApiLetterTemplate>, string>({
      query: (id) => `/letter-templates/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LetterTemplate', id }],
    }),

    createLetterTemplate: builder.mutation<ApiResponse<ApiLetterTemplate>, CreateLetterTemplateRequest>({
      query: (body) => ({
        url: '/letter-templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LetterTemplate'],
    }),

    updateLetterTemplate: builder.mutation<ApiResponse<ApiLetterTemplate>, { id: string; data: UpdateLetterTemplateRequest }>({
      query: ({ id, data }) => ({
        url: `/letter-templates/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LetterTemplate', id }, 'LetterTemplate'],
    }),

    setDefaultLetterTemplate: builder.mutation<ApiResponse<ApiLetterTemplate>, string>({
      query: (id) => ({
        url: `/letter-templates/${id}/set-default`,
        method: 'POST',
      }),
      invalidatesTags: ['LetterTemplate'],
    }),

    previewLetterTemplate: builder.mutation<Blob, { id: string; htmlContentOverride?: string }>({
      query: ({ id, htmlContentOverride }) => ({
        url: `/letter-templates/${id}/preview`,
        method: 'POST',
        body: htmlContentOverride ? { htmlContentOverride } : undefined,
        responseHandler: (response: { blob(): Promise<Blob> }) => response.blob(),
      }),
    }),

    deleteLetterTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/letter-templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LetterTemplate'],
    }),
  }),
});

export const {
  useGetLetterTemplatesQuery,
  useGetLetterTemplateByIdQuery,
  useCreateLetterTemplateMutation,
  useUpdateLetterTemplateMutation,
  useSetDefaultLetterTemplateMutation,
  usePreviewLetterTemplateMutation,
  useDeleteLetterTemplateMutation,
} = letterTemplatesApi;
