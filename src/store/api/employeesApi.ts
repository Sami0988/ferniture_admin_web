import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type {
  ApiEmployee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeWorkload,
  ApiProject,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<PaginatedResponse<ApiEmployee>, { page?: number; limit?: number; specialty?: string; search?: string }>({
      query: (params) => ({
        url: '/employees',
        params: {
          ...(params.page != null && { page: String(params.page) }),
          ...(params.limit != null && { limit: String(params.limit) }),
          ...(params.specialty != null && { specialty: params.specialty }),
          ...(params.search != null && { search: params.search }),
        },
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Employee', 'Calendar'],
    }),

    getEmployeeById: builder.query<ApiResponse<ApiEmployee>, string>({
      query: (id) => ({ url: `/employees/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }, 'Calendar'],
    }),

    createEmployee: builder.mutation<ApiResponse<ApiEmployee>, CreateEmployeeRequest>({
      query: (body) => ({
        url: '/employees',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employee'],
    }),

    updateEmployee: builder.mutation<ApiResponse<ApiEmployee>, { id: string; data: UpdateEmployeeRequest }>({
      query: ({ id, data }) => ({
        url: `/employees/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Employee', id }, 'Employee'],
    }),

    activateEmployee: builder.mutation<ApiResponse<ApiEmployee>, string>({
      query: (id) => ({
        url: `/employees/${id}/activate`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Employee', id }, 'Employee'],
    }),

    deactivateEmployee: builder.mutation<ApiResponse<ApiEmployee>, string>({
      query: (id) => ({
        url: `/employees/${id}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Employee', id }, 'Employee'],
    }),

    getEmployeeProjects: builder.query<ApiResponse<ApiProject[]>, string>({
      query: (id) => ({ url: `/employees/${id}/projects` }),
      providesTags: ['Project'],
    }),

    getEmployeeWorkload: builder.query<ApiResponse<EmployeeWorkload>, string>({
      query: (id) => ({ url: `/employees/${id}/workload` }),
    }),

    deleteEmployee: builder.mutation<void, string>({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employee'],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useActivateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useGetEmployeeProjectsQuery,
  useGetEmployeeWorkloadQuery,
  useDeleteEmployeeMutation,
} = employeesApi;
