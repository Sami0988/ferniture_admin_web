import type { PaginatedResponse } from '@/types/api';

export function transformPaginatedResponse<T>(response: any): PaginatedResponse<T> {
  // Handle: { data: [...], total, page, limit, totalPages, hasNext, hasPrevious }
  if (Array.isArray(response?.data) && 'total' in response) {
    return {
      success: true,
      data: response.data,
      pagination: {
        page: response.page ?? 1,
        limit: response.limit ?? 20,
        total: response.total ?? 0,
        totalPages: response.totalPages ?? 0,
      },
    };
  }

  // Handle: { success: true, data: { data: [...], total, page, limit, totalPages } }
  if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
    const raw = response.data;
    return {
      success: response.success ?? true,
      data: raw.data ?? [],
      pagination: {
        page: raw.page ?? 1,
        limit: raw.limit ?? 20,
        total: raw.total ?? 0,
        totalPages: raw.totalPages ?? 0,
      },
    };
  }

  // Handle: { success: true, data: [...] } (no pagination)
  if (Array.isArray(response?.data)) {
    return {
      success: response.success ?? true,
      data: response.data,
      pagination: { page: 1, limit: response.data.length, total: response.data.length, totalPages: 1 },
    };
  }

  // Fallback
  return {
    success: false,
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}
