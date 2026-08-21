import { baseApi } from '../baseApi';
import { transformPaginatedResponse } from '@/lib/api-transforms';
import type { AuditLog, AuditLogFilters, ApiResponse, PaginatedResponse } from '@/types/api';

export const auditLogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<PaginatedResponse<AuditLog>, AuditLogFilters>({
      query: (params) => ({
        url: '/audit-logs',
        params: {
          ...(params.page != null && { page: String(params.page) }),
          ...(params.limit != null && { limit: String(params.limit) }),
          ...(params.entityType != null && { entityType: params.entityType }),
          ...(params.userId != null && { userId: params.userId }),
        },
      }),
      transformResponse: transformPaginatedResponse,
      providesTags: ['AuditLog', 'Calendar'],
    }),

    getAuditLogsByEntity: builder.query<ApiResponse<AuditLog[]>, { entityType: string; entityId: string }>({
      query: ({ entityType, entityId }) => ({
        url: `/audit-logs/${entityType}/${entityId}`,
      }),
      providesTags: ['AuditLog', 'Calendar'],
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
  useGetAuditLogsByEntityQuery,
} = auditLogsApi;
