import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiProject,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateProjectStatusRequest,
  ProjectFilters,
  ProjectStatusHistory,
  ProjectAssignee,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const projectsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProjects: builder.query<PaginatedResponse<ApiProject>, ProjectFilters>({
      query: (params) => ({
        url: '/projects',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Project'],
    }),

    getProjectById: builder.query<ApiResponse<ApiProject>, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),

    createProject: builder.mutation<ApiResponse<ApiProject>, CreateProjectRequest>({
      query: (body) => ({
        url: '/projects',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project', 'Customer'],
    }),

    updateProject: builder.mutation<ApiResponse<ApiProject>, { id: string; data: UpdateProjectRequest }>({
      query: ({ id, data }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Project', id }, 'Project'],
    }),

    updateProjectStatus: builder.mutation<ApiResponse<ApiProject>, { id: string; data: UpdateProjectStatusRequest }>({
      query: ({ id, data }) => ({
        url: `/projects/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Project', id }, 'Project'],
    }),

    getStatusHistory: builder.query<ApiResponse<ProjectStatusHistory[]>, string>({
      query: (id) => `/projects/${id}/status-history`,
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),

    getProjectAssignees: builder.query<ApiResponse<ProjectAssignee[]>, string>({
      query: (id) => `/projects/${id}/assignees`,
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),

    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project', 'Customer'],
    }),

    removeAssignee: builder.mutation<void, { projectId: string; employeeId: string }>({
      query: ({ projectId, employeeId }) => ({
        url: `/projects/${projectId}/assignees/${employeeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Project', id: projectId }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useUpdateProjectStatusMutation,
  useGetStatusHistoryQuery,
  useGetProjectAssigneesQuery,
  useDeleteProjectMutation,
  useRemoveAssigneeMutation,
} = projectsApi;
