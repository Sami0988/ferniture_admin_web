import { baseApi } from '../baseApi';
import type { ApiNotification, ApiResponse } from '@/types/api';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<ApiNotification[]>, void>({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),

    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation<ApiResponse<ApiNotification>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
