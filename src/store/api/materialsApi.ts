import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiMaterial,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  ApiMaterialSelection,
  AddProjectMaterialRequest,
  ApproveMaterialRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

function buildMaterialFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'swatchImage' && value instanceof File) {
      formData.append('swatchImage', value);
    } else if (key === 'images' && Array.isArray(value) && value.length > 0) {
      value.forEach((file: File) => {
        if (file instanceof File) {
          formData.append('images', file);
        }
      });
    } else if (key !== 'swatchImage' && key !== 'images' && value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });
  return formData;
}

export const materialsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMaterials: builder.query<PaginatedResponse<ApiMaterial>, { category?: string; isActive?: boolean; page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/materials',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Material'],
    }),

    getMaterialById: builder.query<ApiResponse<ApiMaterial>, string>({
      query: (id) => `/materials/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Material', id }],
    }),

    createMaterial: builder.mutation<ApiResponse<ApiMaterial>, CreateMaterialRequest>({
      query: (body) => ({
        url: '/materials',
        method: 'POST',
        body: buildMaterialFormData(body),
      }),
      invalidatesTags: ['Material'],
    }),

    updateMaterial: builder.mutation<ApiResponse<ApiMaterial>, { id: string; data: UpdateMaterialRequest }>({
      query: ({ id, data }) => ({
        url: `/materials/${id}`,
        method: 'PUT',
        body: buildMaterialFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Material', id }, 'Material'],
    }),

    deleteMaterial: builder.mutation<void, string>({
      query: (id) => ({
        url: `/materials/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Material'],
    }),

    getProjectMaterials: builder.query<ApiResponse<ApiMaterialSelection[]>, string>({
      query: (projectId) => `/projects/${projectId}/materials`,
      providesTags: ['MaterialSelection'],
    }),

    addProjectMaterial: builder.mutation<ApiResponse<ApiMaterialSelection>, { projectId: string; data: AddProjectMaterialRequest }>({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/materials`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MaterialSelection', 'Project'],
    }),

    approveProjectMaterial: builder.mutation<ApiResponse<ApiMaterialSelection>, { projectId: string; materialId: string; data: ApproveMaterialRequest }>({
      query: ({ projectId, materialId, data }) => ({
        url: `/projects/${projectId}/materials/${materialId}/approve`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['MaterialSelection', 'Project'],
    }),

    removeProjectMaterial: builder.mutation<void, { projectId: string; materialId: string }>({
      query: ({ projectId, materialId }) => ({
        url: `/projects/${projectId}/materials/${materialId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MaterialSelection', 'Project'],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialByIdQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useGetProjectMaterialsQuery,
  useAddProjectMaterialMutation,
  useApproveProjectMaterialMutation,
  useRemoveProjectMaterialMutation,
} = materialsApi;
