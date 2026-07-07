import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type { AuditLog, AuditLogFilters, ApiResponse, PaginatedResponse } from '@/types/api';

export const auditLogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<PaginatedResponse<AuditLog>, AuditLogFilters>({
      query: (params) => ({
        url: '/audit-logs',
        params,
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['AuditLog'],
    }),

    getAuditLogsByEntity: builder.query<ApiResponse<AuditLog[]>, { entityType: string; entityId: string }>({
      query: ({ entityType, entityId }) => ({
        url: `/audit-logs/${entityType}/${entityId}`,
      }),
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
  useGetAuditLogsByEntityQuery,
} = auditLogsApi;
