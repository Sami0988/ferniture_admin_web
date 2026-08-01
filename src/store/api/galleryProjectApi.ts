import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  GalleryProject,
  CreateGalleryProjectRequest,
  UpdateGalleryProjectRequest,
  GalleryProjectFilters,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const galleryProjectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGalleryProjects: builder.query<PaginatedResponse<GalleryProject>, GalleryProjectFilters>({
      query: (params) => ({
        url: '/admin/gallery-project',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Gallery'],
    }),

    getGalleryProjectById: builder.query<ApiResponse<GalleryProject>, string>({
      query: (id) => `/admin/gallery-project/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Gallery', id }],
    }),

    getGalleryProjectsByProjectId: builder.query<ApiResponse<GalleryProject[]>, string>({
      query: (projectId) => `/admin/gallery-project/project/${projectId}`,
      providesTags: ['Gallery'],
    }),

    createGalleryProject: builder.mutation<ApiResponse<GalleryProject>, CreateGalleryProjectRequest>({
      query: (body) => {
        const formData = new FormData();
        formData.append('division', body.division);
        if (body.imageUrl) formData.append('imageUrl', body.imageUrl);
        if (body.title) formData.append('title', body.title);
        if (body.roomType) formData.append('roomType', body.roomType);
        if (body.aspect) formData.append('aspect', body.aspect);
        if (body.projectId) formData.append('projectId', body.projectId);
        if (body.image) formData.append('image', body.image);
        return {
          url: '/admin/gallery-project',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Gallery'],
    }),

    updateGalleryProject: builder.mutation<ApiResponse<GalleryProject>, { id: string; data: UpdateGalleryProjectRequest }>({
      query: ({ id, data }) => {
        const formData = new FormData();
        if (data.division) formData.append('division', data.division);
        if (data.imageUrl) formData.append('imageUrl', data.imageUrl);
        if (data.title) formData.append('title', data.title);
        if (data.roomType) formData.append('roomType', data.roomType);
        if (data.aspect) formData.append('aspect', data.aspect);
        if (data.projectId) formData.append('projectId', data.projectId);
        if (data.image) formData.append('image', data.image);
        return {
          url: `/admin/gallery-project/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Gallery', id }, 'Gallery'],
    }),

    toggleGalleryProjectFeatured: builder.mutation<ApiResponse<GalleryProject>, string>({
      query: (id) => ({
        url: `/admin/gallery-project/${id}/feature`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Gallery', id }, 'Gallery'],
    }),

    deleteGalleryProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/gallery-project/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Gallery'],
    }),
  }),
});

export const {
  useGetGalleryProjectsQuery,
  useGetGalleryProjectByIdQuery,
  useGetGalleryProjectsByProjectIdQuery,
  useCreateGalleryProjectMutation,
  useUpdateGalleryProjectMutation,
  useToggleGalleryProjectFeaturedMutation,
  useDeleteGalleryProjectMutation,
} = galleryProjectApi;
