import { baseApi } from '../baseApi';
import type {
  DashboardReport,
  ProjectReport,
  RevenueReport,
  CustomerReport,
  OverdueReport,
  EmployeePerformanceReport,
  ApiResponse,
} from '@/types/api';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardReport: builder.query<ApiResponse<DashboardReport>, void>({
      query: () => ({ url: '/reports/dashboard' }),
      providesTags: ['DashboardReport', 'Calendar'],
    }),

    getProjectReport: builder.query<ApiResponse<ProjectReport>, { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/reports/projects',
        params,
      }),
      providesTags: ['Calendar'],
    }),

    getRevenueReport: builder.query<ApiResponse<RevenueReport>, { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/reports/revenue',
        params,
      }),
      providesTags: ['Calendar'],
    }),

    getCustomerReport: builder.query<ApiResponse<CustomerReport>, void>({
      query: () => ({ url: '/reports/customers' }),
      providesTags: ['Calendar'],
    }),

    getOverdueReport: builder.query<ApiResponse<OverdueReport>, void>({
      query: () => ({ url: '/reports/overdue' }),
      providesTags: ['Calendar'],
    }),

    getEmployeePerformanceReport: builder.query<ApiResponse<EmployeePerformanceReport[]>, { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/reports/employee-performance',
        params,
      }),
      providesTags: ['Calendar'],
    }),
  }),
});

export const {
  useGetDashboardReportQuery,
  useGetProjectReportQuery,
  useGetRevenueReportQuery,
  useGetCustomerReportQuery,
  useGetOverdueReportQuery,
  useGetEmployeePerformanceReportQuery,
} = reportsApi;
