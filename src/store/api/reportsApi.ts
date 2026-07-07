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
      query: () => '/reports/dashboard',
      providesTags: ['DashboardReport'],
    }),

    getProjectReport: builder.query<ApiResponse<ProjectReport>, { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/reports/projects',
        params,
      }),
    }),

    getRevenueReport: builder.query<ApiResponse<RevenueReport>, { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/reports/revenue',
        params,
      }),
    }),

    getCustomerReport: builder.query<ApiResponse<CustomerReport>, void>({
      query: () => '/reports/customers',
    }),

    getOverdueReport: builder.query<ApiResponse<OverdueReport>, void>({
      query: () => '/reports/overdue',
    }),

    getEmployeePerformanceReport: builder.query<ApiResponse<EmployeePerformanceReport[]>, { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/reports/employee-performance',
        params,
      }),
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
