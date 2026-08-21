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
  ProjectPaymentSummary,
  RecordProjectPaymentRequest,
  RecordPaymentResponse,
  ProjectAttachment,
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
      providesTags: ['Project', 'Calendar'],
    }),

    getProjectById: builder.query<ApiResponse<ApiProject>, string>({
      query: (id) => ({ url: `/projects/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Project', id }, 'Calendar'],
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
      query: (id) => ({ url: `/projects/${id}/status-history` }),
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),

    getProjectAssignees: builder.query<ApiResponse<ProjectAssignee[]>, string>({
      query: (id) => ({ url: `/projects/${id}/assignees` }),
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

    getProjectPayments: builder.query<ApiResponse<ProjectPaymentSummary>, string>({
      query: (id) => ({ url: `/projects/${id}/payments` }),
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),

    recordPayment: builder.mutation<ApiResponse<RecordPaymentResponse>, { projectId: string; data: RecordProjectPaymentRequest }>({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/pay`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Project', id: projectId }, 'Project'],
    }),

    // Attachments
    getAttachments: builder.query<ApiResponse<ProjectAttachment[]>, string>({
      query: (projectId) => ({ url: `/projects/${projectId}/attachments` }),
      providesTags: (_result, _error, projectId) => [{ type: 'Project', id: projectId }],
    }),

    uploadAttachment: builder.mutation<ApiResponse<ProjectAttachment>, { projectId: string; file: File; type?: string }>({
      query: ({ projectId, file, type }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (type) formData.append('type', type);
        return {
          url: `/projects/${projectId}/attachments`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Project', id: projectId }],
    }),

    deleteAttachment: builder.mutation<void, { projectId: string; attachmentId: string }>({
      query: ({ projectId, attachmentId }) => ({
        url: `/projects/${projectId}/attachments/${attachmentId}`,
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
  useGetProjectPaymentsQuery,
  useRecordPaymentMutation,
  useGetAttachmentsQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
} = projectsApi;
