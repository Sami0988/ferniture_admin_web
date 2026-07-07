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
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['Employee'],
    }),

    getEmployeeById: builder.query<ApiResponse<ApiEmployee>, string>({
      query: (id) => `/employees/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }],
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
      query: (id) => `/employees/${id}/projects`,
      providesTags: ['Project'],
    }),

    getEmployeeWorkload: builder.query<ApiResponse<EmployeeWorkload>, string>({
      query: (id) => `/employees/${id}/workload`,
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
